/**
 * https://github.com/christkv/node-mongodb-native
 * http://expressjs.com/
 * https://github.com/visionmedia/haml.js
 */
var sys     = require("sys");
var mongodb = require("mongodb");
var Db = mongodb.Db,
  Server = mongodb.Server;

var express = require('express');
var app = express.createServer();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.register('.haml', require('hamljs'));
  app.use(express.logger());
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

var dbPool = [];

function getDB() {
  var host = "127.0.0.1";
  var port = 27017;
  var db = dbPool.shift();
  if (db == null) {
    db = new Db('blog', new Server(host, port, {}), {native_parser:true});
  }
  return db;
}

function withDB(callback) {
  var db = getDB();
  if (db.state == "connected") {
    callback(null, db);
  } else {
    db.open(function(err, db) {
      callback(err, db);
    });
  }
}

function releaseDB(db) {
  dbPool.unshift(db);
}

app.get('/', function(req, res) {
  res.redirect("/posts/");
});

app.get("/posts/", function(req, res) {
  withDB(function(err, db) {
    db.collection("posts", function(err, posts) {
      posts.find(function(err, cursor) {
        var body = "";
        var result = [];
        cursor.each(function(err, post) {
          if (post != null) {
            result.push(post);
          }
          if (post == null) {
            releaseDB(db);
            res.render("posts.haml", {posts : result});
          }
        });
      });
    });
  });
});

app.get("/posts/new", function(req, res) {
  res.render("new.haml", {post : {}});
});

app.post("/posts/", function(req, res) {
  withDB(function(err, db) {
    db.collection("posts", function(err, posts) {
      var post = {
        title : req.body.title,
        content : req.body.content
      };
      posts.insert(post, function(err, obj) {
        var id = obj[0]._id;
        releaseDB(db);
        res.redirect("/posts/" + id + "/");
      });
    });
  });
});

app.get(/\/posts\/(\w{24,})\/?$/, function(req, res) {
  var id = req.params[0];
  withDB(function(err, db) {
    db.collection("posts", function(err, posts) {
      var ObjectID = db.bson_serializer.ObjectID;
      posts.find({_id : new ObjectID(id)}, {limit : 1}, function(err, cursor) {
        cursor.nextObject(function(err, post) {
          res.render("post.haml", {post : post});
          releaseDB(db);
        });
      });
    });
  });
});

app.get(/\/posts\/(\w{24,})\/edit$/, function(req, res) {
  var id = req.params[0];
  withDB(function(err, db) {
    db.collection("posts", function(err, posts) {
      var ObjectID = db.bson_serializer.ObjectID;
      posts.find({_id : new ObjectID(id)}, {limit : 1}, function(err, cursor) {
        cursor.nextObject(function(err, post) {
          res.render("edit.haml", {post : post});
          releaseDB(db);
        });
      });
    });
  });
});

app.put(/\/posts\/(\w{24,})\/?$/, function(req, res) {
  var id = req.params[0];
  withDB(function(err, db) {
    db.collection("posts", function(err, posts) {
      var ObjectID = db.bson_serializer.ObjectID;
      var objectID = new ObjectID(id);
      var post = {
        _id : objectID,
        title : req.body.title,
        content : req.body.content
      };
      posts.update({_id : objectID}, post, function(err) {
        releaseDB(db);
        res.redirect("/posts/" + post._id);
      });
    });
  });
});

app.delete(/\/posts\/(\w{24,})\/?$/, function(req, res) {
  var id = req.params[0];
  withDB(function(err, db) {
    var posts = new mongodb.Collection(db, 'posts');
    var ObjectID = db.bson_serializer.ObjectID;
    var objectID = new ObjectID(id);
    posts.findAndModify({_id : objectID}, [], {}, {remove: true}, function(err, obj) {
      releaseDB(db);
      res.header("Content-Type", "application/json");
      if (err) {
        var result = {success : false, message : err};
        res.send(JSON.stringify(result));
      } else {
        var result = {success : true};
        res.send(JSON.stringify(result));
      }
    });
  });
});

app.listen(3000);


