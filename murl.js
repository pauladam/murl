(function() {
  var addUrl, db, doGet, doPost, endResponse, fs, getListing, getUrl, http, port, qs, readPost, route, saveDb, server, size, urlFromKey;

  port = 9999;

  fs = require('fs');

  http = require('http');

  qs = require('querystring');

  db = JSON.parse(fs.readFileSync('db.json'));

  urlFromKey = function(key) {
    return "http://localhost:" + port + "/" + key;
  };

  size = function(obj) {
    var c, x;
    c = 0;
    for (x in obj) {
      c++;
    }
    return c;
  };

  readPost = function(request, cb) {
    var body;
    body = '';
    request.on('data', function(data) {
      return body += data;
    });
    return request.on('end', function() {
      var postData;
      postData = qs.parse(body);
      console.log("data : ", postData);
      return cb(postData);
    });
  };

  endResponse = function(response) {
    response.writeHead(200, {
      'Content-Type': 'text/html'
    });
    return response.end('done');
  };

  saveDb = function(db) {
    return fs.writeFile('db.json', JSON.stringify(db), function() {});
  };

  doPost = function(request, response) {
    return addUrl(request, response);
  };

  doGet = function(request, response) {
    var path;
    path = request.url;
    switch (path) {
      case "/index":
        return getListing(path, response);
      default:
        return getUrl(path, response);
    }
  };

  addUrl = function(request, response) {
    return readPost(request, function(data) {
      var hash, sum, url, x;
      url = data.url;
      sum = ((function() {
        var _results;
        _results = [];
        for (x in url) {
          _results.push(x.charCodeAt(0));
        }
        return _results;
      })()).reduce(function(a, b) {
        return a + b;
      });
      hash = sum.toString(36);
      while (true) {
        if (db[hash]) {
          sum += 1;
          hash = sum.toString(36);
        } else {
          db[hash] = url;
          console.log("added to db " + hash + " => " + url);
          console.log("" + (size(db)) + " db entries");
          saveDb(db);
          break;
        }
      }
      response.writeHead(200, {
        'Content-Type': 'text/html'
      });
      return response.end("Created new short url " + (urlFromKey(hash)) + " \n");
    });
  };

  getListing = function(path, response) {
    var html, k, urls, v;
    urls = (function() {
      var _results;
      _results = [];
      for (k in db) {
        v = db[k];
        _results.push(v);
      }
      return _results;
    })();
    html = ((function() {
      var _results;
      _results = [];
      for (k in db) {
        v = db[k];
        _results.push("<a href='" + v + "'>" + v + "</a>");
      }
      return _results;
    })()).join("<br/>\n");
    response.writeHead(200, {
      'Content-Type': 'text/html'
    });
    return response.end(html);
  };

  getUrl = function(path, response) {
    var key, url;
    key = path.split('/')[1];
    if (!db[key]) {
      response.writeHead(404, {
        'Content-Type': 'text/html'
      });
      return response.end('Entry not found');
    } else {
      url = db[key];
      response.writeHead(301, {
        'Location': url
      });
      return response.end('');
    }
  };

  route = function(request, response) {
    var method, path;
    path = request.url;
    method = request.method;
    console.log("request : " + method + " " + path);
    switch (method) {
      case "POST":
        return doPost(request, response);
      case "GET":
        return doGet(request, response);
    }
  };

  server = http.createServer(function(request, response) {
    return route(request, response);
  });

  server.listen(port);

}).call(this);
