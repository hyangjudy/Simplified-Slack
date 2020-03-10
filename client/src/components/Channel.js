import React, { Component } from "react";
import { getMessages, post, getChannelName, checkHasUsertoken } from "./UserFunctions";
import Message from "./Message";
import Notification from "./Notification";

class Channel extends Component {
  constructor() {
    super();
    this.state = {
      url: "",
      channelID: 0,
      channelName: "",
      isJustOpened: true,
      // to dynamically track read and polled messages
      last_read_message_id: 0,
      last_polled_message_id: 0,
      unread_messages_num: 0,
      // to post new messages
      new_message: "",
      new_reply: "",
      // to display messages
      messages: [],
    };

    this.map = new Map([
      ["new_message_form", "new_message"],
      ["new_reply_form", "new_reply"]
    ]);

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.checkVisible = this.checkVisible.bind(this);
    this.handleChildUnmount = this.handleChildUnmount.bind(this);
  }

  checkHasUsertokenRepeatly(){
    if(!checkHasUsertoken()){
      clearInterval(this.interval);
      alert('Your usertoken has expired!')
      this.props.history.push(`/`)
    }
  }

  componentDidMount() {
    document.getElementsByClassName('replies_container')[0].style.display = 'none'

    // Gets channelID
    var relativePath = this.props.location.pathname;
    var pathSegs = relativePath.split("/");
    var channelID = pathSegs[pathSegs.length - 1];
    this.setState({
      url: this.props.location,
      channelID: channelID
    });

    // Gets ChannelName
    const getChannelNameReq = {
      channel_id: channelID,
      usertoken: localStorage.usertoken
    };

    getChannelName(getChannelNameReq).then(ChannelName => {
      if (ChannelName === null || ChannelName === undefined) return;
      this.setState({ channelName: ChannelName });
      document.getElementById("channel_name").innerHTML = "#" + ChannelName;
    });

    // Starts checking usertoken
    this.check = setInterval(() => this.checkHasUsertokenRepeatly(), 500);

    // Starts polling messages
    this.interval = setInterval(() => this.getMesssagesRepeatly(), 500);
  }

  componentWillUnmount() {
    this.setState({ messages: [],})
    clearInterval(this.interval);
    clearInterval(this.check);
  }

  handleChildUnmount(){
    this.setState({ messages: [],})
  }

  getMesssagesRepeatly() {
    const getMesssagesReq = {
      url:
        "/api/messages/" +
        this.state.channelID +
        "?last_read_message_id=" +
        this.state.last_read_message_id,
      usertoken: localStorage.usertoken
    };

    const copyMessages = Object.assign([], this.state.messages);
    const copyMessagesLength = copyMessages.length;
    var unread_messages_num = this.state.unread_messages_num;
    const copy_last_read_message_id = this.state.last_read_message_id;
    const copy_last_polled_message_id = this.state.last_polled_message_id;

    getMessages(getMesssagesReq).then(res => {
      if (res === null || res === undefined) return;
      let messages = res['messages']
      let server_side_last_read_message_id = res['server_side_last_read_message_id']
      let max_last_read_message_id = Math.max(copy_last_read_message_id, server_side_last_read_message_id)

      messages.forEach((message, index) => {
        console.log('max_last_read_message_id:', max_last_read_message_id)
        console.log('message.id:', message.id)
        if (message.id > max_last_read_message_id && message.id > copy_last_polled_message_id) {
          unread_messages_num = unread_messages_num + 1;
        } 
        if (index >= copyMessagesLength){
          copyMessages.push(message);
        }else{
          copyMessages[index]['cnt_replies'] = message['cnt_replies'];
        }
      });

      this.setState({
        messages: copyMessages,
        unread_messages_num: unread_messages_num,
        last_read_message_id: max_last_read_message_id,
      });

      if(messages!==null&&messages.length>0){
        this.setState({
          last_polled_message_id: messages[messages.length - 1]["id"]
        });  
      }

      if(this.state.isJustOpened){
        let last_read_message_id = max_last_read_message_id
        let messages_div = document.getElementById("messages");
        if (last_read_message_id === 0) {
          messages_div.scrollTop = 0;   
        } else {
          let last_read_message_div = document.getElementById(
            "message_id_" + last_read_message_id
          );
          messages_div.scrollTop = 
            last_read_message_div.offsetTop + last_read_message_div.offsetHeight - messages_div.offsetHeight;
        }
        this.setState({isJustOpened: false})
      }
    });
  }

  scrollToUnread() {
    let last_read_message_id = this.state.last_read_message_id
    let messages_div = document.getElementById("messages");
    if (last_read_message_id === 0) {
      messages_div.scrollTop = 0;   
    } else {
      let last_read_message_div = document.getElementById(
        "message_id_" + last_read_message_id
      );
      messages_div.scrollTop =
        last_read_message_div.offsetTop + last_read_message_div.offsetHeight;
    }
    this.checkVisible();
  }

  checkVisible() {
    let messages_div = document.getElementById("messages");
    let messages_children = messages_div.childNodes;

    var last_read_message_id = this.state.last_read_message_id;
    var unread_messages_num = this.state.unread_messages_num;

    for (var i = 0; i < messages_children.length; i++) {
      let child = messages_children[i];
      let segs = child.id.split("_");
      var child_id = parseInt(segs[segs.length - 1]);

      if (child_id <= last_read_message_id) continue;

      let isTopBetween =
        child.getBoundingClientRect().top >=
          messages_div.getBoundingClientRect().top &&
        child.getBoundingClientRect().top <=
          messages_div.getBoundingClientRect().bottom;
      let isBottomBetween =
        child.getBoundingClientRect().bottom >=
          messages_div.getBoundingClientRect().top &&
        child.getBoundingClientRect().top <=
          messages_div.getBoundingClientRect().bottom;
      if (isTopBetween || isBottomBetween) {
        unread_messages_num -= 1;
        last_read_message_id = child_id;
      }
    }

    this.setState({ last_read_message_id: last_read_message_id });
    this.setState({ unread_messages_num: unread_messages_num });
  }

  render() {

    console.log('unread_messages_num:', this.state.unread_messages_num)

    return (
      <div className="container" id="channel_page_container">
        <div className="container_header">
          <h1 className="text-center" id="channel_name">Channel</h1>
        </div>

        <div className="container_body_wrapper">

          <div className="messages_container">
            <div id="new_message_notification">
              {this.state.unread_messages_num > 0 ? (
                <Notification
                  num={this.state.unread_messages_num}
                  scrollToUnread={this.scrollToUnread.bind(this)}
                />
              ) : null}
            </div>

            <div id="messages" onScroll={this.checkVisible}>
              {this.state.messages.length > 0 
                ? this.state.messages.map((message, index) => {
                    return (
                        <Message
                          key={message.id}
                          id={message.id}
                          sender_name={message.sender_name}
                          created_time={message.created_time}
                          content={message.content}
                          cnt_replies={message.cnt_replies}
                          unmountMe={this.handleChildUnmount}
                        />
                    );
                  })
                : null
              }
            </div>

            <div id="message_input">
              <form name="new_message_form" onSubmit={this.onSubmit}>
                <textarea
                  name="new_message"
                  id="new_message_textarea"
                  onChange={this.onChange}>
                </textarea>
                <button type="submit">Submit</button>
              </form>
            </div>

          </div>

          <div className="replies_container">
            <span
              id="close"
              onClick={() => {
                document.getElementsByClassName("replies_container")[0].style.display = "none";
                document.getElementsByClassName("messages_container")[0].style.width = "100%";
                document.getElementById("new_message_notification").style.display = "block";}}>
              x
            </span>
            <div className="container_header" id="header">
              Thread
            </div>
            <div className="replies">
              <div id="origin_message"></div>
              <div id="other_replies"></div>
            </div>
            <div id="reply_input">
              <form name="new_reply_form" onSubmit={this.onSubmit}>
                <textarea name="new_reply" id="new_reply_textarea" onChange={this.onChange}></textarea>
                <button type="submit">Submit</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  onSubmit(e) {
    e.preventDefault();

    let item_name = this.map.get(e.target.name);

    const is_reply = (item_name==="new_reply");
    if(is_reply && this.state.new_reply.length===0){
      return;
    }else if(!is_reply && this.state.new_message.length===0){
      return
    }

    if(is_reply){
      let parentNode = document.getElementById("origin_message").childNodes[0]
      var segs = parentNode.id.split("_");
      var parent_message_id = parseInt(segs[segs.length - 1]);
      console.log(parent_message_id);
    }

    const newMessage = {
      url: "/api/post/" + this.state.channelID,
      usertoken: localStorage.usertoken,
      content: is_reply ? this.state.new_reply : this.state.new_message,
      is_reply: is_reply,
      parent_message_id: is_reply ? parent_message_id : -1
    };

    post(newMessage)

    if(is_reply){
      document.getElementById('new_reply_textarea').value = ''
      this.setState({ new_reply: ''})
    }else{
      document.getElementById('new_message_textarea').value = ''
      this.setState({ new_message: ''})
    }
  }
}

export default Channel;
