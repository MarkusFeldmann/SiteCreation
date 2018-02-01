var appSettings = require('../../appSettings.js');
var mongoose = require('mongoose');
var configDB = require('../../config/database.js');
var keysSchema = require('../../config/keys.schema.js');
var Key = require('../models/keys.js');

//mongoose.connect(configDB.url);
//var connection = mongoose.connection;

//var keysSchemaObject = JSON.parse(keysSchema);
//var schema = new mongoose.Schema(keysSchema);
//var keys = mongoose.model('keys', schema);

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

function getKeys(jwks_uri) {
    require('https').get(jwks_uri, function (response) {
        var body = '';
        response.on('data', function (chunk) { body += chunk });
        response.on('end', function () {
            var data = JSON.parse(body);
            Key.findOne({ 'keys.kty': 'RSA' }, function (err, key) {
                if (!err) {
                    // Delete the old keys and save the new
                    Key.deleteMany({ 'keys.kty': 'RSA' }, function (err, key) {
                        console.log("Deleted keys from DB");

                        // Store the newly created ones
                        var newkey = new Key();
                        for(let i=0; i<data.keys.length; i++) {
                        newkey.keys.push(
                            {
                                kty: data.keys[i].kty,
                                use: data.keys[i].use,
                                e: data.keys[i].e,
                                kid: data.keys[i].kid,
                                n: data.keys[i].n,
                                x5c: data.keys[i].x5c,
                                x5t: data.keys[i].x5t
                            });
                        }

                        newkey.save(function (err, rec) {
                            console.log("Saving Key Data in DB " + rec);
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
        Key.findOne({'keys.kty': 'RSA'}, function(err, key) {
            if(err)
            {
                console.log("Failed to retrieve keys, not loaded yet?");
            }
            else{
                if(key){
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
