from flask import Flask, render_template, request, jsonify
from flask_bcrypt import Bcrypt
from functools import wraps
from datetime import datetime, timedelta
from threading import Lock
import mysql.connector
import jwt
import configparser

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
bcrypt = Bcrypt(app)

# Configure
config = configparser.ConfigParser()
config.read('secrets.cfg')
PEPPER = config['mysql']['PEPPER']
DB_USER = config['mysql']['DB_USER']
DB_PASSWORD = config['mysql']['DB_PASSWORD']
DB_DBNAME = config['mysql']['DB_DBNAME']
JWT_KEY = config['jwt']['JWT_KEY']
JWT_TTL = int(config['jwt']['JWT_TTL'])
TOKEN_TTL = int(config['reset']['TOKEN_TTL'])
SENDGRID_API_KEY = config['sendgrid']['SENDGRID_API_KEY']

# server-side data structures
jwt_last_decoded_payload = {} # store the content of the token that just been decoded
tokens = {} # track user tokens
reset_tokens = {} # track the token to reset password
last_read = {} # tracking last read message id for each user
lock = Lock() # required when performing query (to avoid concurrent database operation)

# MySQL
cnx = mysql.connector.connect(user=DB_USER,
                              password=DB_PASSWORD,
                              database=DB_DBNAME)
cursor = cnx.cursor(dictionary=True, buffered=True)


#--------------------------------- Index -----------------------------------

@app.route('/')
def index():
    return app.send_static_file('index.html')

#--------------------------------- Wrappers -----------------------------------

def authentication_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Checks if has Authorization
        authorization = request.headers.get('Authorization')
        if authorization is None:
            return {'error': 'Cannot find session token'}, 401

        # Extracts token
        token = authorization.split(' ')[1]
        if len(token)==0:
            return {'error': 'Cannot find session token'}, 401

        # Decodes token
        try:
            jwt_payload = jwt.decode(token, JWT_KEY, algorithms=['HS256'])
            user_id = jwt_payload['id']
            if user_id not in tokens or tokens[user_id] != token:
                return {'error': 'Invalid session token'}, 401
        except jwt.exceptions.InvalidSignatureError as err:
            return {'error': 'Invalid session token'}, 401
        except jwt.ExpiredSignatureError as err: # Signature has expired
            return {'error': 'Token has expired'}, 401
        else:
            global jwt_last_decoded_payload
            jwt_last_decoded_payload = jwt_payload

        return f(*args, **kwargs)
    return decorated_function


def get_jwt_last_decoded_payload():
    '''
    Gets global jwt_last_decoded_payload,
    NOTE: only call the function after authentication_required
    '''
    return jwt_last_decoded_payload

# ---------------------------- User related route ------------------------------

@app.route('/api/register', methods=['POST'])
def register():
    # Parses the name, email, password of the user
    body = request.get_json()
    name = body['name']
    email = body['email']
    password = bcrypt.generate_password_hash(body['password'] + PEPPER).decode('utf-8')

    try:
        # Inserts the user to `users`
        query = """INSERT INTO users(name, email, password)
                   VALUES('{}', '{}', '{}')""".format(name, email, password)
        modify_query(query)

        # Fetches the id of the lately-inserted user
        query = "SELECT LAST_INSERT_ID();"
        user_id = fetch_query(query, False)['LAST_INSERT_ID()']

        # Creates token for the user
        exp_time = datetime.utcnow() + timedelta(seconds=JWT_TTL)
        token = jwt.encode({'name': name,
                            'email': email,
                            'id': user_id,
                            'exp' : exp_time},
                            JWT_KEY,
                            algorithm='HS256').decode("utf-8")
        global tokens
        tokens[user_id] = token

    except mysql.connector.Error as err:
        return {'errorcode': err.errno, 'error': "Error: {}".format(err)}, 400

    return {'token': token}, 200


@app.route('/api/login', methods=['POST'])
def login():
    # Parses the email, password of the user
    body = request.get_json()
    email = body['email']
    password = body['password'] + PEPPER

    # Fetches the password with email
    query = "SELECT * FROM users WHERE email='{}'".format(email)
    rv = fetch_query(query, False)

    # Cannot find the row
    if rv is None:
        return {'error': 'The account doesn\'t exist'}, 404

    # Password not match!
    if not bcrypt.check_password_hash(rv['password'], password):
        return {'error': 'Wrong password'}, 401

    # Creates token
    user_id = rv['id']
    exp_time = datetime.utcnow() + timedelta(seconds=JWT_TTL)
    token = jwt.encode({'name': rv['name'],
                        'email': rv['email'],
                        'id': user_id,
                        'exp' : exp_time},
                        JWT_KEY,
                        algorithm='HS256').decode("utf-8")
    global tokens
    tokens[user_id] = token

    return {'token': token}, 200


@app.route('/api/user', methods=['POST'])
@authentication_required
def update_user_info():
    # Retrieves user_id from jwt_last_decoded_payload
    user_id = get_jwt_last_decoded_payload()['id']

    body = request.get_json()
    for item in ['name', 'email']:
        if item not in body:
            continue

        # Updates the row in users
        try:
            item_value = body[item]
            query = """UPDATE users
                          SET {} = '{}'
                        WHERE id = '{}'""".format(item, item_value, user_id)
            modify_query(query)
        except mysql.connector.errors.IntegrityError as e:
            if item=='email':
                return {'error': 'The email has already be registered by another user!'}, 400
            else:
                return {'error': e}, 500
        else:
            # Updates token for the user
            authorization = request.headers.get('Authorization')
            old_token = authorization.split(' ')[1]
            old_token_decoded = jwt.decode(old_token, JWT_KEY, algorithms=['HS256'])
            old_token_decoded[item] = item_value;
            new_token = jwt.encode(old_token_decoded,
                                   JWT_KEY,
                                   algorithm='HS256').decode("utf-8")
            global tokens
            tokens[user_id] = new_token

            return {'message': "Updated {} successfully".format(item), 'token': new_token}, 200

    return {'error': 'The request doesn\'t change name or email'}, 403

# --------------------------- Reset password route ----------------------------

@app.route('/api/update_password', methods=['POST'])
def update_password():
    body = request.get_json()
    token = body['token']
    password = body['password'] + PEPPER
    
    # Checks if the url expires 
    jwt_payload = {}
    try:
        jwt_payload = jwt.decode(token, JWT_KEY, algorithms=['HS256'])
    except jwt.exceptions.InvalidSignatureError as err:
        return {'error': 'Invalid token'}, 401
    except jwt.ExpiredSignatureError as err: # Signature has expired
        return {'error': 'The url has expired'}, 401

    # Checks if the token in tokens
    reset_token = jwt_payload['reset_token']
    if reset_token not in reset_tokens:
        return {'error': 'Invalid session token'}, 401

    # Updates the password in MySQL
    user_id = reset_tokens[reset_token]
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    query = """UPDATE users
                  SET password = '{}'
                WHERE id = '{}'""".format(hashed_password, user_id)
    modify_query(query)
    del reset_tokens[reset_token]

    return {'message': 'Updated password successfully'}, 200

@app.route('/reset_password', methods=['GET'])
def reset_password():
    # Checks if the url expires 
    token = request.args.get("token")
    jwt_payload = {}
    try:
        jwt_payload = jwt.decode(token, JWT_KEY, algorithms=['HS256'])
    except (jwt.exceptions.InvalidSignatureError, jwt.ExpiredSignatureError) as err:
        return render_template("404.html"), 404

    # Checks if the token in tokens
    reset_token = jwt_payload['reset_token']
    if reset_token not in reset_tokens:
        return render_template("404.html"), 404

    # If not expires, render expire html
    return app.send_static_file('index.html')

@app.route('/api/forget_password', methods=['POST'])
def forget_password():
    # Checks if the user exists by query
    email = request.get_json()['email']
    query = "SELECT * FROM users WHERE email='{}'".format(email)
    rv = fetch_query(query, False)
    if rv is None:
        return {'error': 'The email doensn\'t exist'}, 404
    user_name = rv['name']
    user_id = rv['id']

    # Creates a temporary link
    reset_token = bcrypt.generate_password_hash(str(rv)).decode('utf-8')
    exp_time = datetime.utcnow() + timedelta(seconds=TOKEN_TTL)
    link_param = jwt.encode({'reset_token': reset_token,
                             'exp': exp_time},
                             JWT_KEY,
                             algorithm='HS256').decode("utf-8")
    global reset_tokens
    reset_tokens[reset_token] = user_id
    reset_password_link = "http://127.0.0.1:5000/reset_password?token=" + link_param

    # Generates email body
    
    body_template_p = open("./emails/reset.html", "r") 
    body_template = body_template_p.read()
    body = body_template.format(user_name, reset_password_link)

    # Send email to reset password
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail

    message = Mail(
        from_email='no-reply@belay.com',
        to_emails=email,
        subject='[Belay] Reset your password', # + str(datetime.now()),
        html_content=body)

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY) #SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        sg.send(message)
    except Exception as e:
        return {"error": str(e)}, 500
    else:
        return {"message": reset_password_link}, 200

# --------------------------- Channel related route ----------------------------

@app.route('/api/channels', methods=['GET'])
@authentication_required
def get_channels():
    # Retrieves user_id from jwt_last_decoded_payload
    user_id = get_jwt_last_decoded_payload()['id']
    query = """SELECT id AS channel_id, name,
               CASE WHEN creator_id = {} THEN 'True' ELSE 'False' END AS creator_is_me
               FROM channels
               ORDER BY channel_id""".format(user_id)
    channels = fetch_query(query, True)
    return {'channels': channels}, 200

@app.route('/api/delete', methods=['POST'])
@authentication_required
def delete_channel():
    # Retrieves user_id from jwt_last_decoded_payload
    user_id = get_jwt_last_decoded_payload()['id']
    # Parses channel_id
    channel_id = request.get_json()['channel_id']

    # Checks if the user is the creator
    query = """SELECT * 
               FROM channels 
               WHERE id={} and creator_id={}""".format(channel_id, user_id)
    rv = fetch_query(query, False)

    if rv is None:
        return {"error": "You don't have permission to delete the channel"}, 401

    # Delete all messages whose channel_id is channel_id
    query = "DELETE FROM messages WHERE channel_id={}".format(channel_id)
    modify_query(query)

    # Delete the channel from channels
    query = "DELETE FROM channels WHERE id={}".format(channel_id)
    modify_query(query)

    return {'message': 'Deletely all messages in channel {}'.format(channel_id)}, 200

@app.route('/api/create', methods=['POST'])
@authentication_required
def create_new_channel():
    # Retrieves user_id from jwt_last_decoded_payload
    user_id = get_jwt_last_decoded_payload()['id']

    # Parses the name of the channel created
    name = request.get_json()['name']

    try:
        # Inserts into `channels`
        query = """INSERT INTO channels(name, creator_id)
                   VALUES('{}', {})""".format(name, user_id)
        modify_query(query)

        # Fetches the id of the lately-inserted channel
        query = "SELECT LAST_INSERT_ID();"
        channel_id = fetch_query(query, False)['LAST_INSERT_ID()']

    except mysql.connector.errors.IntegrityError as e:
        return {'error': 'Duplicate channel name!'}, 400
    else:
        return {'id': channel_id}, 200

@app.route('/api/channelName', methods=['POST'])
@authentication_required
def get_channel_name():
    # Parses the channel_id
    channel_id = int(request.get_json()['channel_id'])

    # Inserts into `channels`
    query = """SELECT name 
               FROM channels
               WHERE id={}""".format(channel_id)
    rv = fetch_query(query, False)

    return {'name': rv['name']}, 200

# --------------------------- Message related route ----------------------------

@app.route('/api/post/<string:channel_id>', methods=['POST'])
@authentication_required
def post_message(channel_id):
    # Retrieves user_id from jwt_last_decoded_payload
    user_id = get_jwt_last_decoded_payload()['id']
    # Parses channel_id from router
    channel_id = int(channel_id)

    # Parses the name of the channel created
    body = request.get_json()
    content = request.json['content']
    is_reply = request.json['is_reply']
    parent_message_id = -1
    if is_reply:
        parent_message_id = request.json['parent_message_id']
    created_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Inserts the user to `messages`
    query = """INSERT INTO messages(sender_id, channel_id, content, is_reply, parent_message_id, created_time)
               VALUES({}, {}, '{}', {}, {}, '{}')""".format(user_id, channel_id, content, is_reply, parent_message_id, created_time)
    modify_query(query)

    # Fetches the id of the lately-inserted channel
    query = "SELECT LAST_INSERT_ID();"
    message_id = fetch_query(query, False)['LAST_INSERT_ID()']

    return {'id': message_id}, 200

@app.route('/api/messages/<string:channel_id>', methods=['GET'])
@authentication_required
def get_messages(channel_id):
    # Retrieves user_id from jwt_last_decoded_payload
    user_id = get_jwt_last_decoded_payload()['id']
    # Parses channel_id from router
    channel_id = int(channel_id)
    # Parses last_read_message_id from query params
    last_read_message_id = int(request.args.get('last_read_message_id'))
    server_side_last_read_message_id = 0

    # Updates last_read
    global last_read
    if user_id not in last_read:
        last_read[user_id] = {}
    if channel_id in last_read[user_id]:
        server_side_last_read_message_id = last_read[user_id][channel_id]
    if channel_id not in last_read[user_id] or last_read[user_id][channel_id] < last_read_message_id:
        last_read[user_id][channel_id] = last_read_message_id
        print("Updated last_read:  {{ {} : {} }}".format(user_id, last_read_message_id))

    # Fetches messages
    query = """SELECT t.id, t.sender_name, t.created_time, t.content,
                      COUNT(m.parent_message_id) AS cnt_replies
               FROM
               (SELECT m.id,
                        u.name AS sender_name,
                        m.created_time,
                        m.content
               FROM messages m
               INNER JOIN users u
               ON m.sender_id=u.id
               WHERE m.channel_id={} and m.is_reply=FALSE) t
               LEFT JOIN messages m
               ON t.id = m.parent_message_id
               GROUP BY t.id, m.parent_message_id
               ORDER BY t.id""".format(channel_id)
    messages = fetch_query(query, True)
    return {'messages': messages, 'server_side_last_read_message_id':server_side_last_read_message_id}, 200


@app.route('/api/replies/<string:parent_message_id>', methods=['GET'])
@authentication_required
def get_replies(parent_message_id):
    # Parses last_polled_reply_id from query params
    last_polled_reply_id = int(request.args.get('last_polled_reply_id'))

    query = """SELECT t.id, u.name AS sender_name, t.content, t.created_time
               FROM
               (SELECT m.id, m.sender_id, m.content, m.created_time
               FROM messages m
               WHERE m.is_reply=TRUE and m.parent_message_id={} and m.id>{}) t
               LEFT JOIN users u
               ON t.sender_id=u.id
               ORDER BY t.id""".format(int(parent_message_id), last_polled_reply_id)
    replies = fetch_query(query, True)
    return {'replies': replies}, 200

# ----------------------------- HELPER FUNCTIONS -------------------------------

def fetch_query(query, fetchall):
    '''
    Fetches data from tables
    :param query: the query
    :param fetchall: if true, fetch all rows statified; if false, fetch one line
    '''
    global cnx
    with lock:
        cursor = cnx.cursor(dictionary=True, buffered=True)
        cursor.execute(query)
        if fetchall:
            result = cursor.fetchall()
        else:
            result = cursor.fetchone()
        cursor.close()
        return result

def modify_query(query):
    '''
    Inserts data into tables or updates
    :param query: the query
    '''
    global cnx
    with lock:
        cursor = cnx.cursor()
        cursor.execute(query)
        cursor.close()
        cnx.commit()

def gen_random_string():
    '''Returns random string with length of 20'''
    import string, random
    letters = string.ascii_letters
    return ''.join(random.choice(letters) for i in range(20))
