import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'

class ChannelItem extends Component {

	onClick(e) {
		this.props.history.push("/channel/" + e.target.parentNode.id)
	}

	render() {

		let button = (
				<button
					className='delete_channel_item_button'
					onClick={this.props.delete}>
				Delete
				</button>
			)

		return (
			<div className='channel' id={this.props.channel_id} key={this.props.key}>
				<span className='channel_name' onClick={this.onClick.bind(this)}>{this.props.name}</span>
				{this.props.creator_is_me==='True' ? button : null}
			</div>
		    )
		}
}

export default withRouter(ChannelItem)
