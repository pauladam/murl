# μurl - a tiny url shortening service

# TODO accept new urls through GET instead of post
# TODO on new url reception, respond to client with shortened url so they can save / paste whatever

port = 9999
fs = require 'fs'
http = require 'http'
qs = require 'querystring'
db = JSON.parse(fs.readFileSync('db.json'))

urlFromKey = (key) ->
  "http://localhost:#{port}/#{key}"

size = (obj) ->
  c = 0
  for x of obj
    c++
  c

readPost = (request, cb) ->

  body = ''
  request.on 'data', (data) ->
    body += data

  request.on 'end', () ->
    postData = qs.parse(body)
    console.log "data : ", postData
    cb(postData)

endResponse = (response)->
  response.writeHead 200, {'Content-Type': 'text/html'}
  response.end 'done'

saveDb = (db) ->
  fs.writeFile('db.json', JSON.stringify(db), () -> )

doPost = (request, response) ->
  addUrl(request, response)

doGet = (request, response) ->

  path = request.url

  switch path
    when "/index" then getListing(path, response)
    else getUrl(path, response)

addUrl = (request, response) ->

  readPost request, (data)->

    url = data.url
    sum = (x.charCodeAt(0) for x of url).reduce (a,b) -> a + b
    hash = sum.toString(36)

    while true
      # collision, try the next one
      if db[hash]
        sum += 1
        hash = sum.toString(36)
      else
        db[hash] = url
        console.log "added to db #{hash} => #{url}"
        console.log "#{size(db)} db entries"
        saveDb(db)
        break

    response.writeHead 200, {'Content-Type': 'text/html'}
    response.end "Created new short url #{urlFromKey(hash)} \n"

getListing = (path, response) ->

  urls = (v for k,v of db)
  html = ("<a href='#{v}'>#{v}</a>" for k,v of db).join "<br/>\n"

  response.writeHead 200, {'Content-Type': 'text/html'}
  response.end html

getUrl = (path, response) ->

  key = path.split('/')[1]

  if !db[key]
    response.writeHead 404, {'Content-Type': 'text/html'}
    response.end 'Entry not found'
  else
    url = db[key]
    response.writeHead 301, {'Location': url}
    response.end ''

route = (request, response) ->

  path = request.url
  method = request.method

  console.log "request : #{method} #{path}"

  switch method
    when "POST" then doPost(request, response)
    when "GET" then doGet(request, response)

server = http.createServer (request, response) ->
  route(request, response)
   
server.listen port
