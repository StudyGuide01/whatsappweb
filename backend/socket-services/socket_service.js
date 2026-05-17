import {Server} from 'socket.io'
import UserModel from '../model/user.model.js'
import MessageModel from '../model/message.model.js'

// map to store online users -> userId, SocketId

const onlineUsers = new Map()

// map to track typing status -> userId -> [Conversation]: boolean

const typingUsers = new Map()

const initializeSocket = (server)=>{
    const io = new Server(server, {
        cors:{
            origin: process.env.FRONTEND_URL,
            credentials:true,
            methods: ['GET','POST','PUT','DELETE','OPTIONS']
        },
        pingTimeout: 6000 // disconnect inactive or change tab or logout user 
     });

     // when new connection steblished 
     io.on('connection', (socket)=>{
        console.log(`User is connected: ${socket.id}`)
        userId = null;

        // handle user connection and mark them online in db

        socket.on('user_connected', async(connectingUserId)=>{
            try {
                userId = connectingUserId
                onlineUsers.set(userId, socket.id)
                socket.join(userId) //jona a personal room for direct emit

                // update user status in db
                 await UserModel.findByIdAndUpdate(userId, {
                    $set:{
                        "presence.isOnline:":true,
                        "presence.lastSeen":new Date()
                    }
                 },{new:true})

                 // notify all users that this user is not online
                    io.emit('user_status',{userId, isOnine:true})
            } catch (error) {
                console.log('Error massage handling form socket',error)
            }
        })


        // return online status of requested users
        socket.on('get_user_status',(requestedUserId, callback)=>{
            const isOnline = onlineUsers.has(requestedUserId)
            callback({
                userId:requestedUserId,
                isOnline,
                lastSeen: isOnline ? new Date() : null
            })
        })


        // forward message to reciever if online
            socket.on('send_message',async(message)=>{
                try {
                    const receiverSocketId = onlineUsers.get(message.receiver?._id)
                    if(receiverSocketId){
                        io.to(receiverSocketId).emit('receive_message',message)
                    }
                    
                } catch (error) {
                    console.log('Error While Sending Message: on Socket')
                    socket.emit("message_error",{error:'Failed to send message'})
                }
            })

            // message as readn and notify sender 
            socket.on('message_read', async({messageIds,senderId})=>{
                try {
                    await MessageModel.updateMany({_id:{$in:messageIds}},{$set:{messageStatus:'read'}})

                    const senderSocketId = onlineUsers.get(senderId)
                    if(senderSocketId){
                        messageIds.forEach((messageId)=>{
                            io.to(senderSocketId).emit('message_status_update',{
                                messageId,
                                messageStatus:'read'
                            })
                        })
                    }
                } catch (error) {
                 console.log('Error while updateing message updating status ', error)   
                }
            })

            // handle typing start event and auto-stop after 3s

            socket.on('typing_start',({conversationId, receiverId})=>{
                if(!userId || !conversationId || !receiverId) return;
                if(!typingUsers.has(userId)) typingUsers.set(userId,{});
                const userTyping = typingUsers.get(userId)
                userTyping(conversationId) = true

                //clearn andy existing timout
                if(userTyping[`${conversationId}_timeout`]){
                    clearTimeout(userTyping[`${conversationId}_timeout`])
                }

                //autostop after 3 second
                userTyping[`${conversationId}_timeout`] = setTimeout(()=>{
                    userTyping[conversationId] = false
                    socket.to(receiverId).emit("user_typing",{
                        userId,
                        conversationId,
                        isTyping:false
                    })
                },3000)

                // Notify Recier 
                socket.to(receiverId).emit('user_typing', {userId, conversationId, isTyping:true})
            })


            socket.on('typing_stop',({conversationId, receiverId})=>{
                    if(!userId || !conversationId || !receiverId) return;
                if(typingUsers.has(userId)){
                    const userTyping = typingUsers.get(userId);
                    userTyping(conversationId) = false;

                    if(userTyping[`${conversationId}_timeout`]){
                        clearTimeout(userTyping[`${conversationId}_timeout`])
                        delete userTyping[`${conversationId}_timeout`]
                    }
                };

                socket.to(receiverId).emit('user_typing',{
                    userId,
                    conversationId,
                    isTyping : false
                })
            });


            // Add or updated Reactions
            socket.on('add_reaction',async({messageId, emoji,userId, reactionUserId})=>{
                try {
                    const message = await MessageModel.findById(messageId);
                    if(!message) return;
                    const existingIndex = message.reactions.findIndex(
                        (r)=>r.user.toString()=== reactionUserId
                    )
                    if(existingIndex > -1){
                        const existing = message.reactions(existingIndex)
                        if(existing.emoji === emoji){
                            // remove same reactions
                            message.reactions.splice(existingIndex,1)
                        }else{
                            //CHANGE EMOJI
                            message.reactions[existingIndex].emoji = emoji
                        }
                    }else{
                        // add new reactions
                        message.reactions.push({user:reactionUserId,emoji})
                    }

            await message.save();
            const populateMessage = await MessageModel.find({ conversation: conversationId })
            .populate('sender', 'userName profile.picture')
            .populate('seenBy.user', 'userName profile.picture')
            .populate('reactions.user', 'userName')
            .sort({ createdAt: 1 }) // oldest → newest
            .lean();

            const reactionUpdated = {
                messageId,
                reactions: populateMessage.reactions 
            }

            const senderSocket = onlineUsers.get(populateMessage.sender._id.toString());
            const receiverSocket = onlineUsers.get(populateMessage.receiver?._id.toString());
            if(senderSocket) io.to(senderSocket).emit('reaction_update', reactionUpdated);
            if(receiverSocket) io.to(receiverSocket).emit('reaction_update', reactionUpdated);

                } catch (error) {
                    console.log('Error while sending reactions ',error)
                }
            })
                 //handle disconnection and mark user offline
     const handleDisconnection = async()=>{
        if(!userId) return;  
        try {
            onlineUsers.delete(userId);

            //clear all typing time outs
            if(typingUsers.has(userId)){
                const userTyping = typingUsers.get(userId);
                Object.keys(userTyping).forEach((key)=>{
                    if(key.endsWith('_timeout')) clearTimeout(userTyping[key])
                })

                typingUsers.delete(userId)
            }

        await UserModel.findById(userId,{
            isOnline: false,
            lastSeen:new Date()
        })

        io.emit("user_status",{
            userId,
            isOnline:false,
            lastSeen:  new Date()
        })

        socket.leave(userId);
        console.log(`user ${userId} disconnected`);
        } catch (error) {
            console.log('Error while disconnect user',error)
        }
     }

     //disconnect event
     socket.on('disconnect',handleDisconnection)
     });

//attach online users map to the socket sover for external user
io.socketUserMap = onlineUsers
return io;
}

export default initializeSocket;