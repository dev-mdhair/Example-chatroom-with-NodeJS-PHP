var app = require('express')();
var http = require('http').Server(app);
var socket = require('socket.io')(http);

var port = 3421;


var customer = {
    queue: [],
    chat: [],
    quit: [],
    total: 0
};


socket.on('connection', function(client){
    client.on('subscribe', function(data) { 
        if (data.room == "staff_lobby")
        {
            // staff subscribe
        }
        else
        {
            // customer subscribe

            if (! data.isStaff)
            {
                var exists = false;
                for (var i=customer.queue.length-1; i>=0; i--) {
                    if (customer.queue[i].username === data.username)
                    {
                        exists = true;
                        customer.queue[i].join_at = new Date().toISOString();
                        break;       //<-- Uncomment  if only the first term has to be removed
                    }
                }

                if (exists === false)
                {
                    customer.total++;
                    customer.queue.push({
                        id: customer.total,
                        username: data.username,
                        room: data.room,
                        status: 'new',
                        join_at: new Date().toISOString()
                    });
                }
            }
            else
            {
                // if staff will update queue is talked
                for (var i=customer.queue.length-1; i>=0; i--) {
                    if (customer.queue[i].username === data.room)
                    {
                        customer.queue[i].status = "staff talked";
                        break;       //<-- Uncomment  if only the first term has to be removed
                    }
                }
            }


            client.join(data.room); 
            if (! data.isStaff)
            {
                socket.in(data.room).emit('message', {
                    sender: data.username,
                    message: data.username + " start private chat. You are "+ customer.total + ".",
                    send_at: new Date().toISOString(),
                    isStaff: data.isStaff
                });
                
            }
            else
            {
                socket.in(data.room).emit('message', {
                    sender: data.username,
                    message: data.username + " start private chat.",
                    send_at: new Date().toISOString(),
                    isStaff: data.isStaff
                });
            }
            socket.in("staff_lobby").emit('new_user', {});
            
        }

        console.log('joining room', data.username, data.room);
    });

    // note http://stackoverflow.com/questions/9418697/how-to-unsubscribe-from-a-socket-io-subscription

    client.on('unsubscribe', function(data) { 

        // if staff will update queue is talked
        for (var i=customer.queue.length-1; i>=0; i--) {
            if (customer.queue[i].username === data.room)
            {
                customer.queue[i].status = "out";
                break;       //<-- Uncomment  if only the first term has to be removed
            }
        }

        // remove from queue
        for (var i=customer.queue.length-1; i>=0; i--) {
            if (customer.queue[i].username === data.username)
            {
                customer.queue.splice(i, 1);
                break;       //<-- Uncomment  if only the first term has to be removed
            }
        }

        console.log('leaving room', data.room);
        socket.in(data.room).emit('message', {
            sender: data.username,
            message: data.username + " leave from this chat.",
            send_at: new Date().toISOString()
        });
        client.leave(data.room); 
    });

    client.on('send', function(data) {
        console.log('sending message');
        socket.in(data.room).emit('message', {
            sender: data.username,
            message: data.message,
            send_at: new Date().toISOString(),
            isStaff: data.isStaff
        });
    });
});

app.get('/customer/queue', function(req, res) {
    res.json(customer.queue);
});

http.listen(port, function(){
    console.log('listening on *:'+port);
});