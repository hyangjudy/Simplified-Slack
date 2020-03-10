import React, { Component } from 'react';
import './App.css';
import { BrowserRouter as Router, Route } from 'react-router-dom'

import Navbar from './components/Navbar'
import Landing from './components/Landing'
import Login from './components/Login'
import Register from './components/Register'
import Profile from './components/Profile'
import Channels from './components/Channels'
import Channel from './components/Channel'
import ForgetPassword from './components/ForgetPassword'
import ResetPassword from './components/ResetPassword'


class App extends Component  {
  render() {
    return (
      <Router>
        <div className="App">
          <Navbar />
          <div className="content_container">
            <Route exact path="/" component={Landing} />
            <Route exact path="/profile" component={Profile} />
            <Route exact path="/register" component={Register} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/channels" component={Channels} />
            <Route exact path="/channel/:id" component={Channel} />
            <Route exact path="/forget_password" component={ForgetPassword} />
            <Route exact path="/reset_password" component={ResetPassword} />
          </div>
        </div>
      </Router>
    );
  }

}

export default App;
