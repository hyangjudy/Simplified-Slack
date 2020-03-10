## Simplified-Slack

---
### Features:
1. A user can register for the the app:
![Register Demo](https://github.com/hyangjudy/Simplified-Slack/blob/master/gifs/register.gif)

2. A user can login and logout:
![Login and logout Demo](https://github.com/hyangjudy/Simplified-Slack/blob/master/gifs/login_logout.gif)

3. A user can reset a lost password:
![Reset a lost password Demo](https://github.com/hyangjudy/Simplified-Slack/blob/master/gifs/forget_password.gif)

4. A user can create a channel and post messages (or replies):
![Create a channel and post Demo](https://github.com/hyangjudy/Simplified-Slack/blob/master/gifs/create_channel_n_post.gif)

5. The server side tracks the unread messages of all users and renders a notification on the number of unread messages:
![Unread messages Demo](https://github.com/hyangjudy/Simplified-Slack/blob/master/gifs/unread_messages.gif)

---

### How to run:

1. Install the python dependencies by running `pip install -r requirements.txt`

2. Go to `/secrets.cfg` to set configuration parameters

    + In the `mysql` block:
        ```
        [mysql]
        ......
        DB_USER = <YOUR_DB_USER>
        DB_PASSWORD = <YOUR_DB_PASSWORD>
        DB_DBNAME = <YOUR_DB_DBNAME>
        ```

        1. <span style="color:red">Set **DB_USER** to your database user name</span>

        2. <span style="color:red">Set **DB_PASSWORD** to your database password</span>

        3. <span style="color:red">Set **DB_DBNAME** to your database database name</span>

    + In the `sendgrid` block:
        ```
        [sendgrid]
        SENDGRID_API_KEY = <YOUR_SENDGRID_API_KEY>
        ```

        1. <span style="color:red">Set **SENDGRID_API_KEY** to your sendgrid api key</span>

3. Go to `/sql` and find the two `sql` files to create databases and tables. Run:
 
    `mysql -u <your_database_user_name> -p < 20200308T140800-create_database.sql`

    `mysql -u <your_database_user_name> -p your_database_database_name < 20200308T140900-create_tables.sql`

4. Run ` FLASK_DEBUG=1 flask run ` to start the server

5. Go to `http://127.0.0.1:5000/` to play with the app

---

### Folder Structure
```
final_project/
├── .gitignore
├── app.py
├── client/
│   ├── .gitignore
│   ├── package-lock.json
│   ├── package.json
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   ├── logo192.png
│   │   ├── logo512.png
│   │   ├── manifest.json
│   │   ├── robots.txt
│   │   └── social-network.png
│   ├── README.md
│   └── src/
│       ├── .DS_Store
│       ├── App.css
│       ├── App.js
│       ├── App.test.js
│       ├── components/
│       │   ├── .DS_Store
│       │   ├── Channel.js
│       │   ├── ChannelItem.js
│       │   ├── Channels.js
│       │   ├── ForgetPassword.js
│       │   ├── Landing.js
│       │   ├── Login.js
│       │   ├── Message.js
│       │   ├── Navbar.js
│       │   ├── Notification.js
│       │   ├── Profile.js
│       │   ├── Register.js
│       │   ├── ResetPassword.js
│       │   └── UserFunctions.js
│       ├── index.css
│       ├── index.js
│       ├── logo.svg
│       ├── serviceWorker.js
│       └── setupTests.js
├── emails/
│   └── reset.html
├── readme.md
├── secrets.cfg
├── sql/
│   ├── 20200308T140800-create_database.sql
│   └── 20200308T140900-create_tables.sql
├── static/
│   ├── css/
│   │   ├── main.2c64513b.chunk.css
│   │   └── main.2c64513b.chunk.css.map
│   ├── index.html
│   └── js/
│       ├── 2.8eacd23d.chunk.js
│       ├── 2.8eacd23d.chunk.js.LICENSE.txt
│       ├── 2.8eacd23d.chunk.js.map
│       ├── main.675d2392.chunk.js
│       ├── main.675d2392.chunk.js.map
│       ├── runtime-main.844668cf.js
│       └── runtime-main.844668cf.js.map
└── templates/
    └── 404.html
```
| File/Folder | Details |
| ---- | ---- |
| app.py | the Flask server |
| client | the React component in development (created by `create-react-app client`) |
| emails | the email templates |
| readme.md | this file |
| secrets.cfg | the file that contains configuration data |
| sql | contains sql to create databases and tables |
| static | the single-page React app (created by `npm run build`) |
| templates | contains error handling pages |


---

### Reference:

#### Fonts:
* [Rubik](https://fonts.googleapis.com/css?family=Rubik&display=swap)
* [Roboto](https://fonts.googleapis.com/css?family=Roboto&display=swap)

#### Web page design:
* [Slack](https://slack.com)

#### Refers to:
* [react-flask-mysql-login-reg](https://github.com/ArjunAranetaCodes/MoreCodes-Youtube/tree/master/react-flask-mysql-login-reg)
* [Add Delete Components Dynamically in React](https://www.youtube.com/watch?v=ivM4Yfks_sk)
* [Tutorial: Intro to React](https://reactjs.org/tutorial/tutorial.html)
