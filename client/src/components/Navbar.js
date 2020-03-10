import React, { Component } from 'react'
import { Link, withRouter } from 'react-router-dom'

class Navbar extends Component {
  constructor() {
    super()
    this.state = {
      expandNavbar: false,
      hasToggle: false,
    }
    this.toggle = this.toggle.bind(this)
  }

  componentDidMount() {
    this.setState({expandNavbar: window.innerWidth > 768,
                   hasToggle: window.innerWidth <= 768});
  }

  toggle() {
    this.setState(prevState => {
      console.log('toggle')
      return {expandNavbar: !prevState.expandNavbar}
    })
  }

  logOut(e) {
    e.preventDefault()
    this.toggle()
    localStorage.removeItem('usertoken')
    this.props.history.push(`/`)
  }


  render() {

    const loginRegLink = (
      <ul className="navbar-nav">
        <li className="nav-item">
          <Link to="/" className="nav-link" onClick={this.toggle}>
            Home
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/login" className="nav-link" onClick={this.toggle}>
            Login
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/register" className="nav-link" onClick={this.toggle}>
            Register
          </Link>
        </li>
      </ul>
    )

    const userLink = (
      <ul className="navbar-nav">
        <li className="nav-item">
          <Link to="/" className="nav-link" onClick={this.toggle}>
            Home
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/profile" className="nav-link" onClick={this.toggle}>
            My Profile
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/channels" className="nav-link" onClick={this.toggle}>
            Channels
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/" onClick={this.logOut.bind(this)} className="nav-link">
            Logout
          </Link>
        </li>
      </ul>
    )

    const toggle = (
      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbars"
        aria-controls="navbars"
        aria-expanded="false"
        aria-label="Toggle navigation"
        onClick={this.toggle}>
        <div className="navbar-toggler-lines">
          <div className="navbar-toggler-line" />
          <div className="navbar-toggler-line" />
          <div className="navbar-toggler-line" />
        </div>
      </button>
    )

    return (
      <nav
        className="navbar-container">


        {this.state.hasToggle ? toggle : null}

        <div
          className={this.state.hasToggle
                     ?  (this.state.expandNavbar ? "navbar show" : "navbar collapse" )
                     : "dummy"}
          id="navbars"
        >
          {localStorage.usertoken ? userLink : loginRegLink}

        </div>
      </nav>
    )
  }
}

export default withRouter(Navbar)
