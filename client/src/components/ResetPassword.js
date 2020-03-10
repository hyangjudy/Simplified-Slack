import React, { Component } from 'react'
import { updatePassword } from './UserFunctions'

class ResetPassword extends Component {
  constructor() {
    super()
    this.state = {
      password: '',
      retype_password: '',
    }
    this.onChange = this.onChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  onChange(e) {
    let name = e.target.name
    this.setState({ [name]: e.target.value }, () => {
      this.checkInputs(name);
    });
  }

  checkInputs(name){
    switch(name){
      case 'password':
        this.checkPassword()
        break
      case 'retype_password':
        console.log('enter retype_password')
        this.checkRetypePassword();
        break
      default:
      }
  }

  checkPassword(){
    if(this.state.password.length===0){
      document.getElementById('password_validate_warning').innerText = 'Required'
      return false
    }else if(! /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,100}$/.test(this.state.password)){
      document.getElementById('password_validate_warning').innerText = 'Must be 8 characters or more, needs at least one numeric digit, one uppercase and one lowercase letter'
      return false
    }else{
      document.getElementById('password_validate_warning').innerText = ''
      return true
    }
  }

  checkRetypePassword(){
    if(this.state.password !== this.state.retype_password){
      document.getElementById('retype_password_validate_warning').innerText = 'The passwords you entered do not match.'
      return false
    }else{
      document.getElementById('retype_password_validate_warning').innerText = ''
      return true
    }
  }

  onSubmit(e) {
    e.preventDefault()

    // Checks if all inputs are correct
    if(!this.checkPassword() || !this.checkRetypePassword()) return

    // Sends reset password request
    var urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('token')) return

    const updatePasswordReq = {
      token: urlParams.get('token'),
      password: this.state.password
    }

    console.log(updatePasswordReq)

    updatePassword(updatePasswordReq).then( res => {
      if(res.status===200){
        alert('Updated your password successfully. Will redirect to login page. Please login with your new password')
        this.props.history.push(`/login`)
      }else{
        document.getElementById('update_password_warning').innerText = res.data.error
      }
    })

  }

  componentWillUnmount() {
    //clear all inputs
    this.setState({password: '',
                   retype_password: ''});
  }

  render() {
    return (
      <div className="login_form">
        <h1 className="login_form_header">Password Reset</h1>
        <form id='enter_email_form' onSubmit={this.onSubmit}>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
              placeholder="Password"
              value={this.state.password}
              onChange={this.onChange}
            />
            <span id='password_validate_warning'></span>
          </div>
          <div className="form-group">
            <label htmlFor="password">Confirm password</label>
            <input
              type="password"
              className="form-control"
              name="retype_password"
              placeholder="Retype password"
              value={this.state.retype_password}
              onChange={this.onChange}
            />
            <span id='retype_password_validate_warning'></span>
          </div>
          <div className="form-group">
            <button type="submit">Register!</button>
            <span id='update_password_warning'></span>
          </div>
        </form>
      </div>
    )
  }
}

export default ResetPassword
