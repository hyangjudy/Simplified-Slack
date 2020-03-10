import React, { Component } from 'react'
import jwt_decode from 'jwt-decode'
import { updateName, updateEmail, checkHasUsertoken } from './UserFunctions'

class Profile extends Component {
  constructor() {
    super()
    this.state = {
      oldName: '',
      oldEmail: '',
      newName: '',
      newEmail: '',
      edit_name_form_expanded: false,
      edit_email_form_expanded: false,
    }
    this.onChange = this.onChange.bind(this)
    this.expandOrShrink = this.expandOrShrink.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  checkHasUsertokenRepeatly(){
    if(!checkHasUsertoken()){
      clearInterval(this.interval);
      alert('Your usertoken has expired!')
      this.props.history.push(`/`)
    }
  }

  componentDidMount() {
    this.setStateWithUsertoken()
    document.getElementById('edit_name_form').style.display = 'none'
    document.getElementById('edit_email_form').style.display = 'none'
    this.check = setInterval(() => this.checkHasUsertokenRepeatly(), 500);
  }

  componentWillUnmount() {
    clearInterval(this.check);
    //clear all inputs
    this.setState({oldName: '',
                   oldEmail: '',
                   newName: '',
                   newEmail: '',
                   edit_name_form_expanded: false,
                   edit_email_form_expanded: false});
  }

  setStateWithUsertoken(){
    const decoded = jwt_decode(localStorage.usertoken)
    this.setState({
      oldName: decoded.name,
      oldEmail: decoded.email
    })
  }

  onChange(e) {
    let name = e.target.name
    this.setState({ [name]: e.target.value }, () => {
      if(name==='newName'){
        this.checkName();
      }else if(name==='newEmail'){
        this.checkEmail();
      }
    });
  }

  checkName(){
    if(this.state.newName === this.state.oldName){
      document.getElementById('name_validate_warning').innerText = 'New name cannot be the same as the old one'
    }else if(this.state.newName.length<2){
      document.getElementById('name_validate_warning').innerText = 'Username must be longer than 1'
    }else{
      document.getElementById('name_validate_warning').innerText = ''
      return true
    }
    return false
  }

  checkEmail(){
    if(this.state.newEmail.length===0){
      document.getElementById('email_validate_warning').innerText = 'Required'
    }else if(this.state.newEmail === this.state.oldEmail){
      document.getElementById('email_validate_warning').innerText = 'New email cannot be the same as the old one'
    }else if (! /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(this.state.newEmail)){
      document.getElementById('email_validate_warning').innerText = 'Invalid email address'
    }else{
      document.getElementById('email_validate_warning').innerText = ''
      return true
    }
    return false
  }

  onSubmit(e) {
    e.preventDefault()

    let name = e.target.id
    switch (name) {
      case 'edit_name_form':
        if(!this.checkName()) return;

        const updateNameReq = {
          name: this.state.newName,
          usertoken: localStorage.usertoken
        }

        updateName(updateNameReq).then(res => {
          if(res.status===200){
            this.setStateWithUsertoken()
            this.setState({edit_name_form_expanded: false})
          }else{
            document.getElementById('update_name_warning').innerText = res.data['error']
          }
        })

        break

      case 'edit_email_form':
        if(!this.checkEmail()) return;

        const updateEmailReq = {
          email: this.state.newEmail,
          usertoken: localStorage.usertoken
        }

        updateEmail(updateEmailReq).then(res => {
          if(res.status===200){
            this.setStateWithUsertoken()
            this.setState({edit_email_form_expanded: false})
          }else{
            document.getElementById('update_email_warning').innerText = res.data['error']
          }
        })

        break

      default:
    }
  }

  expandOrShrink(e){
    let button_id = e.target.id
    let form_id = button_id.substring(0, button_id.length-7)
    switch(form_id){
      case 'edit_name_form':
        let name_form_expanded = this.state.edit_name_form_expanded
        document.getElementById('edit_name_form').style.display = name_form_expanded?'none':'block'
        document.getElementById('edit_name_form_button').innerHTML = name_form_expanded?'+':'-'
        this.setState({edit_name_form_expanded: !name_form_expanded})
        break;
      case 'edit_email_form':
        let email_form_expanded = this.state.edit_email_form_expanded
        document.getElementById('edit_email_form').style.display = email_form_expanded?'none':'block'
        document.getElementById('edit_email_form_button').innerHTML = email_form_expanded?'+':'-'
        this.setState({edit_email_form_expanded: !email_form_expanded})
        break;
      default:
    }
  }

  render() {
    return (
      <div className='container'>
        <div className='container_header'>
          <h1 className='text-center'>Profile</h1>
        </div>

        <div className='container_body_wrapper'>
          <div className='container_body'>
            <hr />

            <div className='profile_row'>
              <div className='profile_name'>Name</div>
              <div className='profile_name_value'>{this.state.oldName}</div>
              <div className='profile_button' id='edit_name_form_button' onClick={this.expandOrShrink}>+</div>
            </div>

            <form className='edit_profile_form' id='edit_name_form' onSubmit={this.onSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  name="newName"
                  value={this.state.newName}
                  placeholder="New name"
                  onChange={this.onChange}
                />
                <span id='name_validate_warning'></span>
              </div>
              <div className="form-group">
                <button type='submit'>Update Name</button>
                <span id='update_name_warning'></span>
              </div>
            </form>

            <hr />

            <div className='profile_row'>
              <div className='profile_name'>Email</div>
              <div className='profile_name_value'>{this.state.oldEmail}</div>
              <div className='profile_button' id='edit_email_form_button' onClick={this.expandOrShrink}>+</div>
            </div>

            <form className='edit_profile_form' id='edit_email_form' onSubmit={this.onSubmit}>
              <div className="form-group">
                <input
                  type="email"
                  className="form-control"
                  name="newEmail"
                  value={this.state.newEmail}
                  placeholder="New email address"
                  onChange={this.onChange}
                />
                <span id='email_validate_warning'></span>
              </div>
              <div className="form-group">
                <button type='submit'>Update Email</button>
                <span id='update_email_warning'></span>
              </div>
            </form>

            <hr />

          </div>
        </div>
      </div>
    )
  }
}

export default Profile
