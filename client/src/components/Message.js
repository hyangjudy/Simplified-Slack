import React, { Component } from "react";
import { getReplies, stripURL, checkHasUsertoken } from "./UserFunctions";

class Message extends Component {
  constructor() {
    super();
    this.state = {
      id: "",
      last_polled_reply_id: 0,
      replies: [],
      show_replies: false
    };
  }

  dismiss() {
    this.props.unmountMe();
  }

  checkHasUsertokenRepeatly(){
    if(!checkHasUsertoken()){
      clearInterval(this.interval);
      alert('Your usertoken has expired!')
      this.props.history.push(`/`)
    }
  }

  componentDidMount() {
    this.setState({ id: "message_id_" + this.props.id });

    this.check = setInterval(() => this.checkHasUsertokenRepeatly(), 500);
  }

  componentWillUnmount() {
    clearInterval(this.check)
    if(this.interval===null || this.interval===undefined) return
    clearInterval(this.interval)
  }

  onClick(e) {
    this.displayThreads(e.target.parentNode);
  }

  displayThreads(div_message) {
    this.setState({show_replies: true})

    // Gets parent_message_id
    var segs = div_message.id.split("_");
    var parent_message_id = segs[segs.length - 1];
    console.log(parent_message_id);

    // Displays threads
    if(window.innerWidth <= 768){
      document.getElementById("new_message_notification").style.display = "none";
      document.getElementsByClassName("messages_container")[0].style.width = "0%";
      document.getElementsByClassName("replies_container")[0].style.width = "100%";
      document.getElementsByClassName("replies_container")[0].style.display = "block";
    }else{
      document.getElementsByClassName("messages_container")[0].style.width = "60%";
      document.getElementsByClassName("replies_container")[0].style.width = "40%";
      document.getElementsByClassName("replies_container")[0].style.display = "block";
    }
    

    let classNames = ["reply", "replies_counts_separator"];
    classNames.forEach(function(className) {
      var elements = document.getElementsByClassName(className);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    });

    // Copies origin node
    let div_origin = div_message.cloneNode(true);
    let div_origin_last_child = div_origin.lastChild;
    div_origin.removeChild(div_origin_last_child);
    div_origin.setAttribute("class", "reply");
		div_origin.appendChild(document.createElement("hr"));
    document.getElementById("origin_message").appendChild(div_origin);


    //display old replies
    let replies = this.state.replies
    replies.forEach(reply => {
      let div_reply = document.createElement("div");
      div_reply.id = "reply_id_" + reply["id"];
      div_reply.className = "reply";

      let span_name = document.createElement("span");
      span_name.className = "sender_name";
      span_name.innerHTML = reply["sender_name"];
      div_reply.append(span_name);

      let span_created_time = document.createElement("span");
      span_created_time.className = "created_time";
      span_created_time.innerHTML = reply["created_time"];
      div_reply.append(span_created_time);

      let div_content = document.createElement("div");
      div_content.className = "content";
      div_content.textContent = reply["content"];
      div_reply.append(div_content);

      let img_urls = stripURL(reply["content"]);
      if(img_urls.length>0){
        let message_image_wrapper = document.createElement("div");
        message_image_wrapper.className = 'message_image_wrapper'
        for(var i=0;i<img_urls.length;i++){
          let img = document.createElement("img");
          img.src = img_urls[i];
          img.alt = img_urls[i];
          message_image_wrapper.append(img);
        }
        div_reply.append(message_image_wrapper);
      }

      document.getElementById("other_replies").appendChild(div_reply);
    });

    if(this.interval!==null && this.interval!==undefined) clearInterval(this.interval)
    this.interval = setInterval(
      () => this.getRepliesRepeatly(parent_message_id),
      1000
    );

  }

  getRepliesRepeatly(parent_message_id) {
    const last_polled_reply_id = this.state.last_polled_reply_id;
    const getRepliesReq = {
      url:
        "/api/replies/" +
        parent_message_id +
        "?last_polled_reply_id=" +
        last_polled_reply_id,
      usertoken: localStorage.usertoken
    };

    const copyReplies = Object.assign([], this.state.replies);

    getReplies(getRepliesReq).then(replies => {
      if (replies === null || replies === undefined || replies.length === 0) return;

      replies.forEach(reply => {
        copyReplies.push(reply);

        let div_reply = document.createElement("div");
        div_reply.id = "reply_id_" + reply["id"];
        div_reply.className = "reply";

        let span_name = document.createElement("span");
        span_name.className = "sender_name";
        span_name.innerHTML = reply["sender_name"];
        div_reply.append(span_name);

        let span_created_time = document.createElement("span");
        span_created_time.className = "created_time";
        span_created_time.innerHTML = reply["created_time"];
        div_reply.append(span_created_time);

        let div_content = document.createElement("div");
        div_content.className = "content";
        div_content.textContent = reply["content"];
        div_reply.append(div_content);

				let img_urls = stripURL(reply["content"]);
				if(img_urls.length>0){
					let message_image_wrapper = document.createElement("div");
					message_image_wrapper.className = 'message_image_wrapper'
					for(var i=0;i<img_urls.length;i++){
						let img = document.createElement("img");
						img.src = img_urls[i];
						img.alt = img_urls[i];
						message_image_wrapper.append(img);
					}
					div_reply.append(message_image_wrapper);
				}

        document.getElementById("other_replies").appendChild(div_reply);
      });

      this.setState({
        last_polled_reply_id: replies[replies.length - 1]["id"],
        replies: copyReplies
      });

    });
  }

  render() {
    let intext_image_urls = stripURL(this.props.content);
    if (intext_image_urls && intext_image_urls.length>0) {
      var intext_images = intext_image_urls.map((url, index) => {
        return (
          <div className="message_image_wrapper" key={index}>
            <img src={`${url}`} alt={`${url}`} />
          </div>
        );
      });
    }

    return (
      <div className="message" id={this.state.id} key={this.state.id}>
        <span className="sender_name">
          {this.props.sender_name}
        </span>
        <span className="created_time">{this.props.created_time}</span>
        <div className="content">{this.props.content}</div>
        {intext_images ? intext_images : null}
        <div className="reply_counts" onClick={this.onClick.bind(this)}>
          {this.props.cnt_replies > 0
            ? this.props.cnt_replies + " replies"
            : "Reply"}
        </div>
      </div>
    );
  }
}

export default Message;
