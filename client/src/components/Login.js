import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { login } from './UserFunctions'

class Login extends Component {
  constructor() {
    super()
    this.state = {
      email: '',
      password: '',
    }

    this.onChange = this.onChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  onChange(e) {
    let name = e.target.name
    this.setState({ [name]: e.target.value }, () => {
      if(name==='email') this.checkEmail();
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

    // check if inputs are correct
    if(this.checkEmail()===false) return

    // send login request
    const user = {
      email: this.state.email,
      password: this.state.password
    }

    login(user).then(res => {
      if(res.status===200){
        const usertoken = localStorage.usertoken
        console.log("Got a temporary token: ", usertoken)
        this.props.history.push(`/profile`)
      }else{
        document.getElementById('login_failure_reason').innerText = res.data['error']
      }
    })
  }

  componentWillUnmount() {
    //clear all inputs
    this.setState({email: '',
                   password: ''});
  }

  render() {
    return (
      <div className="content_container container">
        <form noValidate className="login_form" onSubmit={this.onSubmit}>
          <h1 className="login_form_header">Please sign in</h1>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              className="form-control"
              name="email"
              placeholder="Enter email"
              value={this.state.email}
              onChange={this.onChange}
            />
            <span id='email_validate_warning'></span>
          </div>
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
          </div>
          <div className="form-group">
            <button type="submit">Sign in</button>
          </div>
          <div className="form-group">
            <span id="login_failure_reason"></span>
          </div>
          <div className="form-group" id="links-form-group">
            <Link id="forget_password_link" to="/forget_password">Forgot Password?</Link>
            <br />
            <Link id="register_link" to="/register">Sign up</Link>
          </div>
        </form>
      </div>
    )
  }
}

export default Login
