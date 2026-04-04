import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email:{
        type :String,
        required:true,
        unique:true
    },
    fullname:{
        firstName:{type:String , required:true},
        lastName:{type:String, required:true}
    },
    password:{type:String , required : function(){return !this.googleId}},
    googleId: {type:String},
    role:{
        type:String,
        enum:['student','staff','admin'],
        default:'student'
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    availabilityStatus: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
},{timestamps:true})

const userModel = mongoose.model("user",userSchema)

export default userModel