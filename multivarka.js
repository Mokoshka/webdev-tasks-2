const mongodb = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/test';

var Database = function (url) {
    this.url = url;
    this.requests = {};
    this.inversion = false;
    this.updateData = {$set: {}};
};

module.exports.server = (url) => {
    return new Database(url);
};

Database.prototype.collection = function (name) {
    this.collection = name;
    return this;
};

Database.prototype.where = function (name) {
    if (this.field) {
        this.field += `&${name}`
    } else {
        this.field = name;
    }
    return this;
};

Database.prototype.equal = function (value) {
    setRequest(this, {$eq: value});
    return this;
};

Database.prototype.lessThan = function (value) {
    setRequest(this, {$lt: value});
    return this;
};

Database.prototype.greatThan = function (value) {
    setRequest(this, {$gt: value});
    return this;
};

Database.prototype.include = function (values) {
    setRequest(this, {$in: values});
    return this;
};

Database.prototype.not = function () {
    this.inversion = true;
    return this;
};

Database.prototype.set = function (fieldName, value) {
    this.updateData['$set'][fieldName] = value;
    return this;
};

Database.prototype.find = function (callback) {
    makeRequest(this, 'find', callback);
};

Database.prototype.insert = function (record, callback) {
    this.requests = record;
    makeRequest(this, 'insert', callback);
};

Database.prototype.remove = function (callback) {
    makeRequest(this, 'remove', callback);
};

Database.prototype.update = function (callback) {
    makeRequest(this, 'updateMany', callback);
};

function makeRequest(database, type, callback) {
    mongodb.connect(database.url, (err, db) => {
        if (err) {
            callback(err);
        }

        var collection = db.collection(database.collection);
        var request;

        switch(type){
            case 'find': {
                request = collection[type](database.requests).toArray();
                break;
            }
            case 'updateMany': {
                request = collection[type](database.requests, database.updateData);
                database.updateData = {};
                break;
            }
            default: {
                request = collection[type](database.requests);
            }
        }
        request
            .then(data => {
                callback(null, data);
                db.close();
            })
            .catch(err => {
                callback(err);
            });
        database.requests = {};
    })
}

function setRequest(database, req) {
    if (database.inversion) {
        database.requests[database.field] = {$not: req};
        database.inversion = false;
    } else {
        database.requests[database.field] = req;
    }
    database.field = '';
}
