import mongoose, {Schema} from "mongoose"

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,//one who is subscriing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,//one to whome 'subscriber' is subscriing
        ref: "User"
    }
},{timestamps: true})


export const Subscription = mongoose.model("Subscription", subscriptionSchema)