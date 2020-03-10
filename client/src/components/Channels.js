import React, { Component } from 'react'
import { getAllChannels, createChannel, deleteChannel, checkHasUsertoken } from './UserFunctions'
import ChannelItem from './ChannelItem'


class Channels extends Component {
  constructor() {
    super()
    this.channelItemID=0
    this.state = {
      newChannelName: '',
      channelItems: [],
    }
    this.onSubmit = this.onSubmit.bind(this)
    this.onChange = this.onChange.bind(this)
  }

  componentDidMount() {
    this.loadChannels()

    // Starts checking usertoken
    this.check = setInterval(() => this.checkHasUsertokenRepeatly(), 500);
  }

  componentWillUnmount() {
    clearInterval(this.check);
  }

  checkHasUsertokenRepeatly(){
    if(!checkHasUsertoken()){
      clearInterval(this.interval);
      alert('Your usertoken has expired!')
      this.props.history.push(`/`)
    }
  }

  loadChannels(){
    if (localStorage.usertoken===null || localStorage.usertoken===undefined) {
      alert('Your token has expired')
      this.props.history.push(`/`)
      return
    }

    //request all channels
    const req = {
        usertoken: localStorage.usertoken
    }

    const channelItems = []

    getAllChannels(req).then(channels => {
      if(channels===null || channels===undefined || channels.length===0) {
        return
      }

      channels.forEach(channel => {
        this.channelItemID = this.channelItemID + 1
        channel['id'] = this.channelItemID
        channel['key'] = this.channelItemID //keep every key is unique
        channelItems.push(channel)
      })

      this.setState({channelItems: channelItems})
    });
  }

  delete = (channel_id, index) => {
    const deleleChannel = {
      channel_id: channel_id,
      usertoken: localStorage.usertoken
    }

    deleteChannel(deleleChannel).then(res => {
      if(res.status){
        const copyChannelItems = Object.assign([], this.state.channelItems)
        copyChannelItems.splice(index, 1)
        this.setState({channelItems:  copyChannelItems})
      }
    })
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value }, () => {
      this.checkName();
    })
  }

  checkName(){
    console.log(/^[a-zA-Z0-9-_]+$/.test(this.state.newChannelName))
    if(this.state.newChannelName.length === 0){
      document.getElementById('name_validate_warning').innerText = 'Required'
      return false
    }else if (/^[a-zA-Z0-9-_]+$/.test(this.state.newChannelName)){
      document.getElementById('name_validate_warning').innerText = ''
      return true
    }else{
      document.getElementById('name_validate_warning').innerText = 'The name should only consist of numbers, letters, and underscores (and no spaces)'
      return false
    }
  }

  onSubmit(e){
    e.preventDefault()

    if(!this.checkName()) return

    const createChannelReq = {
      usertoken: localStorage.usertoken,
      name: this.state.newChannelName,
    }

    createChannel(createChannelReq).then(res => {
      if(res.status===200) {
        let channel_id = res.data['id']
        let redirect_url = `/channel/`+channel_id
        alert("Create Successfully")
        this.props.history.push(redirect_url)
      }else{
        document.getElementById('create_channel_warning').innerHTML = res.data['error']
      }
    })
  }

  render() {
    return (
      <div className="container">
        <div className='container_header'>
          <h1 className='text-center'>Channels</h1>
          <div
            id='create_channel_div'
            onMouseEnter={() => document.getElementById("create_channel_span").style.display = 'block'}
            onMouseLeave={() => document.getElementById("create_channel_span").style.display = 'none'}
            onClick={() => document.querySelector('.pop_up_wrapper').style.display = 'block'}
          >
            +
          </div>
          <span id='create_channel_span'>Click to create channel</span>
        </div>

        <div className='container_body_wrapper'>
        
          <div className='container_body'>
            <div className="pop_up_wrapper">
              <form noValidate className="login_form" onSubmit={this.onSubmit}>
                <div
                  className="close"
                  onClick={() => document.querySelector('.pop_up_wrapper').style.display = 'none'}
                >
                x
                </div>
                <h1 className="login_form_header">Create a new channel</h1>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    name="newChannelName"
                    placeholder="New channel name"
                    value={this.state.password}
                    onChange={this.onChange}
                  />
                  <span id='name_validate_warning'></span>
                </div>
                <div className="form-group">
                  <button type="submit">Create</button>
                </div>
                <div className="form-group">
                  <span id="create_channel_warning"></span>
                </div>
              </form>
            </div>

            <div className="channels">
              <hr />
              {
                this.state.channelItems.map((channelItem, index) => {
                  return (
                    <div key={channelItem.key}>
                      <ChannelItem
                       channel_id={channelItem.channel_id}
                       name={channelItem.name}
                       creator_is_me={channelItem.creator_is_me}
                       delete={this.delete.bind(this, channelItem.channel_id, index)}
                      />
                      <hr />
                    </div>
                  )
                })
              }
            </div>

          </div>
        </div>
      </div>
    )
  }
}

export default Channels
