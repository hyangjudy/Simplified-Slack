import React, { Component } from 'react'
import { sendResetPassword } from './UserFunctions'

class ForgetPassword extends Component {
  constructor() {
    super()
    this.state = {
      email: '',
    }

    this.onChange = this.onChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  onChange(e) {
    let name = e.target.name
    this.setState({ [name]: e.target.value }, () => {
      this.checkEmail();
    });
  }

  checkEmail(){
    if(this.state.email.length===0){
      document.getElementById('email_validate_warning').innerText = 'Required'
      return false
    }else if (! /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(this.state.email)){
      document.getElementById('email_validate_warning').innerText = 'Invalid email address'
      return false
    }else{
      document.getElementById('email_validate_warning').innerText = ''
      return true
    }
  }

  onSubmit(e) {
    e.preventDefault()

    //check if the inputs are correct
    if(!this.checkEmail()) return

    //sends request to reset password
    const resetPasswordReq = {
      email: this.state.email
    }

    sendResetPassword(resetPasswordReq).then(res => {
      if(res.status===200){
        document.getElementById('login_failure_reason').innerText = 'Sent reset password request successfully'
      }else if(res.status===404){
        document.getElementById('login_failure_reason').innerText = res.data['error']
      }
    })
  }

  componentWillUnmount() {
    //clear all inputs
    this.setState({email: ''});
  }

  render() {
    return (
      <div className="content_container container">
        <div className="login_form">
          <h1 className="login_form_header">Password Reset</h1>
          <p className="instruction">Enter your e-mail address below, and we'll send you an email allowing you to reset your password.</p>
          <form id='enter_email_form' onSubmit={this.onSubmit}>
            <div className="form-group">
              <input
                type="email"
                className="form-control"
                name="email"
                value={this.state.email}
                placeholder="Your email address"
                onChange={this.onChange}
              />
              <span id='email_validate_warning'></span>
            </div>
            <div className="form-group">
              <button type="submit">Reset my password</button>
            </div>
            <div className="form-group">
              <span id="login_failure_reason"></span>
            </div>
          </form>
        </div>
      </div>
    )
  }
}

export default ForgetPassword
