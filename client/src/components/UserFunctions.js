import axios from 'axios'

// -------------------------- User related ----------------------------------

export const register = newUser => {
  return axios
    .post('/api/register', {
      name: newUser.name,
      email: newUser.email,
      password: newUser.password
    })
    .then((response) => {
      if( response.status === 200 ) {
        console.log('Registered successfully')
        localStorage.setItem('usertoken', response.data['token'])
      }
      return response
    }, (error) => {
      console.log('POST /api/update_password failed. Details: ', error.response.data['error'])
      return error.response
    })
}

export const login = user => {
  return axios
    .post('/api/login', {
      email: user.email,
      password: user.password
    })
    .then((response) => {
      if( response.status === 200 ) {
        console.log('Logged in successfully')
        localStorage.setItem('usertoken', response.data['token'])
      }
      return response
    }, (error) => {
      console.log('POST /api/login failed. Details: ', error.response.data['error'])
      return error.response
    })
}

export const sendResetPassword = req => {
  return axios
    .post('/api/forget_password', {
      email: req.email,
    })
    .then((response) => {
      if( response.status === 200 ) {
        console.log('Sent reset password request successfully')
      }
      return response
    }, (error) => {
      console.log('POST /api/forget_password failed. Details: ', error.response.data['error'])
      return error.response
    })
}

export const updatePassword = req => {
  return axios
    .post('/api/update_password', {
      token: req.token,
      password: req.password
    },{
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
    .then((response) => {
      if( response.status === 200 ) {
        console.log('Reset password successfully')
      }
      return response
    }, (error) => {
      console.log('POST /api/update_password failed. Details: ', error.response.data['error'])
      return error.response
    })
}

export const updateName = req => {
  return axios
    .post('/api/user', {
      name: req.name
    },{
      headers: {
        "Authorization" : "Bearer " + req.usertoken
      }
    })
    .then((response) => {
      if( response.status === 200 ) {
        console.log('Updated username successfully')
        localStorage.setItem('usertoken', response.data['token'])
      }
      return response
    }, (error) => {
      console.log('POST /api/user failed. Details: ', error.response.data['error'])
      if(error.response.status === 401){
        localStorage.removeItem('usertoken')
      }
      return error.response
    })
}

export const updateEmail = req => {
  return axios
    .post('/api/user', {
      email: req.email
    },{
      headers: {
        "Authorization" : "Bearer " + req.usertoken
      }
    })
    .then((response) => {
      if( response.status === 200 ) {
        console.log('Updated email address successfully')
        localStorage.setItem('usertoken', response.data['token'])
      }
      return response
    }, (error) => {
      console.log('POST /api/user failed. Details: ', error.response.data['error'])
      if(error.response.status === 401){
        localStorage.removeItem('usertoken')
      }
      return error.response
    })
}

// -------------------------- Channel related ----------------------------------

export const getAllChannels = req => {
  return axios
  .get('/api/channels',
    {headers: {
        "Authorization" : "Bearer " + req.usertoken
      }
    }
  )
  .then((response) => {
    if( response.status === 200 ) {
      return response.data['channels'];
    }
  }, (error) => {
    console.log('GET /api/channels failed. Details: ', error.response.data['error'])
    if(error.response.status === 401){
      localStorage.removeItem('usertoken')
    }
  })
}

export const createChannel = req => {
  return axios
    .post('/api/create', {
      name: req.name
    },{
      headers: {
        "Authorization" : "Bearer " + req.usertoken
      }
    })
    .then((response) => {
      if( response.status === 200 ) {
        console.log('Created channel successfully')
      }
      return response
    }, (error) => {
      console.log('POST /api/create failed. Details: ', error.response.data['error'])
      if(error.response.status === 401){
        localStorage.removeItem('usertoken')
      }
      return error.response
    })
}

export const deleteChannel = req => {
  return axios
    .post('/api/delete', {
      channel_id: req.channel_id
    },{
      headers: {
        "Authorization" : "Bearer " + req.usertoken
      }
    })
    .then((response) => {
      if( response.status === 200 ) {
        console.log('Deleted channel successfully')
        return response
      }
    }, (error) => {
      console.log('POST /api/create failed. Details: ', error.response.data['error'])
      return error.response
    })
}

export const getChannelName = req => {
  return axios
    .post('/api/channelName', {
      channel_id: req.channel_id
    },{
      headers: {
        "Authorization" : "Bearer " + req.usertoken
      }
    })
    .then((response) => {
      if( response.status === 200 ) {
        console.log('Got channel name successfully')
        return response.data['name']
      }
    }, (error) => {
      console.log('POST /api/channelName failed. Details: ', error.response.data['error'])
      if(error.response.status === 401){
        localStorage.removeItem('usertoken')
      }
    })
}

// -------------------------- Message related ----------------------------------

export const stripURL = content => {
  var urlRegex = /(https?:\/\/[^\s]+.(jpg|jpeg|png|gif))/g;
  var matches = content.match(urlRegex);
  return matches==null?"":matches;
}

export const getMessages = req => {
  return axios
  .get(req.url,
    {headers: {
        "Authorization" : "Bearer " + req.usertoken
      }
    }
  )
  .then((response) => {
    if( response.status === 200 ) {
      console.log('Polled messages successfully')
      return response.data
    }
  }, (error) => {
    console.log('GET ', req.url ,' failed. Details: ', error.response.data['error'])
    if(error.response.status === 401){
      localStorage.removeItem('usertoken')
    }
  })
}

export const getReplies = req => {
  return axios
  .get(req.url,
    {headers: {
        "Authorization" : "Bearer " + req.usertoken
      }
    }
  )
  .then((response) => {
    if( response.status === 200 ) {
      console.log('Polled replies successfully')
      return response.data['replies']
    }
  }, (error) => {
    console.log('GET ', req.url ,' failed. Details: ', error.response.data['error'])
  })
}

export const post = newMessage => {
  return axios
    .post(newMessage.url, {
      content: newMessage.content,
      is_reply: newMessage.is_reply,
      parent_message_id: newMessage.parent_message_id
    },{
      headers: {
        "Authorization" : "Bearer " + newMessage.usertoken
      }
    })
    .then((response) => {
      if( response.status === 200 ) {
        console.log('Posted successfully')
      }
    }, (error) => {
      console.log('POST ', newMessage.url ,' failed. Details: ', error.response.data['error'])
      if(error.response.status === 401){
        localStorage.removeItem('usertoken')
      }
    })
}

export const checkHasUsertoken = () => {
  if(localStorage.usertoken===null||localStorage.usertoken===undefined){
    return false
  }
  return true
}
