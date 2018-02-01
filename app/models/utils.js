var appSettings = require('../../appSettings.js');
var mongoose = require('mongoose');
var configDB = require('../../config/database.js');
var keysSchema = require('../../config/keys.schema.js');

mongoose.connect(configDB.url);
var connection = mongoose.connection;

//var keysSchemaObject = JSON.parse(keysSchema);
var schema = new mongoose.Schema(keysSchema);
var keys = mongoose.model('keys', schema);

//var async = require ('async');

var fileUrl = appSettings.oauthOptions.identityMetadata;

function getKeyMetadataUri(cb) {
    require('https').get(fileUrl, function (response) {
        var body = '';
        response.on('data', function (chunk) { body += chunk });
        response.on('end', function () {
            var jwks_uri = JSON.parse(body)['jwks_uri'];
            cb(jwks_uri);
        })
    });
}

function getKeysOld(jwks_uri) {
    require('request').get(jwks_uri, function (error, response, body) {
        if (error) {
            next(error);
        }
        else {
            return JSON.parse(body);
        }
    });
}

function getKeys(jwks_uri) {
    require('https').get(jwks_uri, function (response) {
        var body = '';
        response.on('data', function (chunk) { body += chunk });
        response.on('end', function () {
            var data = JSON.parse(body);
            keys.findOne({ 'keys.kty': 'RSA' }, function (err, key) {
                if (!err) {
                    // Delete the old keys and save the new
                    keys.deleteMany({ 'keys.kty': 'RSA' }, function (err, key) {
                        console.log("Deleted keys from DB");

                        // Store the newly created ones
                        connection.collection('keys').save(data, function (err, records) {
                            console.log("Saving Key Data in DB " + records);
                        })
                    });
                }
            });
        });
    });
}

module.exports = {
    getKeysFromMetadataUri: function () {
        getKeyMetadataUri(getKeys);
    },
    getKeysFromDatabase: function (cb) {
        keys.findOne({'keys.kty': 'RSA'}, function(err, key) {
            if(err)
            {
                console.log("Failed to retrieve keys, not loaded yet?");
            }
            else{
                if(key){
                    var bla = typeof(bla);
                    console.log("keys retrieved, count: " + key);
                    cb(key);
                }
                else
                {
                    // No keys in DB
                    cb(null);
                }
            }
        })
    }
}
