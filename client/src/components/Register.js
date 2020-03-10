import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { register } from './UserFunctions'

class Register extends Component {
  constructor() {
    super()
    this.state = {
      name: '',
      email: '',
      password: '',
      retype_password: ''
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
      case 'name':
        this.checkName()
        break
      case 'email':
        this.checkEmail()
        break
      case 'password':
        this.checkPassword()
        break
      case 'retype_password':
        this.checkRetypePassword();
        break
      default:
      }
  }

  checkName(){
    if(this.state.name.length < 2){
      document.getElementById('name_validate_warning').innerText = 'Name length should be at least 2'
      return false
    }else{
      document.getElementById('name_validate_warning').innerText = ''
      return true
    }
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

    // check if inputs are correct
    let isInputsCorrect = this.checkName()&&this.checkEmail()&&this.checkPassword()&&this.checkRetypePassword()
    if(isInputsCorrect === false) return

    // send register request
    const newUser = {
      name: this.state.name,
      email: this.state.email,
      password: this.state.password
    }

    register(newUser).then(res => {
      if(res.status===200){
        const usertoken = localStorage.usertoken
        console.log("Got a temporary token: ", usertoken)
        this.props.history.push(`/profile`)
      }else if(res.status===400){
        document.getElementById('register_submit_warning').innerText = res.data['error']
      }
    })
  }

  componentWillUnmount() {
    //clear all inputs
    this.setState({name: '',
                   email: '',
                   password: '',
                   retype_password: '' });
  }

  render() {
    return (
      <div className="content_container container">
        <form className="login_form" onSubmit={this.onSubmit}>
          <h1 className="login_form_header">Please register</h1>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              className="form-control"
              name="name"
              placeholder="Enter your name"
              value={this.state.name}
              onChange={this.onChange}
              onBlur={this.onChange}
            />
            <span id='name_validate_warning'></span>
          </div>
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
            <span id='register_submit_warning'></span>
          </div>
          <div className="form-group">
            <Link to="/login">Already have an account?</Link>
          </div>
        </form>
      </div>
    )
  }
}

export default Register
