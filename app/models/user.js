var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    id: String,
    refreshToken: String,
    email: String,
    name: {},
    upn: String,
    displayName: String,
    tokens: [{
        resource: String,
        token: String,
        expires: String,
        expiresDate: String
    }],
    capabilities: [{
        capability: String,
        serviceEndpointUri: String,
        serviceId: String,
        serviceResourceId: String
    }]
});

userSchema.methods.hasToken = function (resourceUri) {
    //Check if a token for the resource is present and still has at least 5 minutes validity period left
    if (typeof this.tokens != "undefined") {
        var uriPosition = this.tokens.findIndex(
            function (a) { return (a.resource == resourceUri) });
        if (uriPosition >= 0) {
            var token = this.tokens[uriPosition];
            if (this.tokenStillValid(token, resourceUri)) {
                return token;
            }
        }
        //No valid token means no.
        return false;
    };
}

userSchema.methods.setToken = function (newToken, resource) {
    var date = new Date(newToken.expires_on * 1000);
    if(!newToken.resource) {
        //is this ok? there should always be a resource, check for this
        return false;
    }

    if (typeof this.tokens != "undefined") {
        var uriPosition = this.tokens.findIndex(
            function (a) { return (a.resource == resource) });
        if (uriPosition >= 0) {
            var oldToken = this.tokens[uriPosition];    
            oldToken.token = newToken.access_token;
            oldToken.expiresDate = date,
            oldToken.expires = newToken.expires_on;
            //Renew the access token as well
            //this.refreshToken = newToken.refresh_token;           // CHECK OUT IF REFRESH TOKEN HAS TO BE RESET !!!

            this.save(function (err) {
                if (err)
                    throw err;
            });
        }
        else {
            var newToken = {
                resource: resource,
                token: newToken.access_token,
                expiresDate:  date,
                expires: newToken.expires_on
            }
            this.tokens.push(newToken);
            //this.refreshToken = newToken.refresh_token;           // CHECK OUT IF REFRESH TOKEN HAS TO BE RESET !!!
            this.save(function (err) {
                if (err)
                    throw err;
            });
        }
    }
}

userSchema.methods.getToken = function (resourceUri) {
    var token = this.hasToken(resourceUri);
    if (token) {
        /*var uriPosition = this.tokens.findIndex(
            function(a) {return (a.resource == resourceUri)});
        var token = this.tokens[uriPosition];
        //Check for expiration
        var now = new Date();
        var expiration = new Date(token.expires * 1000);
        var timeLeft = expiration - now;
        //If the remaining time is less that 5 minutes, return false
        if((timeLeft / 1000) >= 300) { */

        return token;
    }
    else {
        return false;
    }
}

userSchema.methods.setCapabilities = function (capabilities) {
    for(var i=0; i<capabilities.length; i++) {
        if(!this.userHasCapability(capabilities[i].capability)) {
            var cap = {
                capability: capabilities[i].capability,
                serviceId: capabilities[i].serviceId,
                serviceResourceId: capabilities[i].serviceResourceId
            }
            
            this.capabilities.push(cap);
        }
    }
    this.save(function (err) {
        if (err)
            throw err;
    });
}

userSchema.methods.userHasCapability = function (capability) {
    if (typeof this.capabilities != "undefined") {
        var capPos = this.capabilities.findIndex(
            function (c) { return (c.capability == capability) });
        if (capPos >= 0) {
            return true;            
        }
        //Capability not present
        return false;
    };
}


userSchema.methods.tokenStillValid = function (token, resource) {
    var uriPosition = this.tokens.findIndex(
        function (a) { return (a.resource == resource) });
    var token = this.tokens[uriPosition];
    //Check for expiration
    var now = new Date();
    var expiration = new Date(token.expires * 1000);
    var timeLeft = expiration - now;
    //If the remaining time is less that 5 minutes, return false
    if ((timeLeft / 1000) >= 300) {
        return true;
    }
    return false;
}
// userSchema.methods.validate = function (result, next) {};

module.exports = mongoose.model('User', userSchema);

// *********************************************************
//
// O365-Node-Express-Ejs-Sample-App, https://github.com/OfficeDev/O365-Node-Express-Ejs-Sample-App
//
// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License:
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// *********************************************************

