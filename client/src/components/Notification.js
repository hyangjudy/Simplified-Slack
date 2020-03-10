import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'

class Notification extends Component {

	render() {
		return (
			<div className="notification" onClick={this.props.scrollToUnread}>
				<span className="unread_messages">{this.props.num} unread messages</span>
			</div>
		)
	}
}

export default withRouter(Notification)
