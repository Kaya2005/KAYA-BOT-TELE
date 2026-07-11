import { getContextInfo } from '../setting/contextInfo.js';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';

export default {
    name:'bye',
    alias:['aurevoir','leave'],
    description:'Enable/disable goodbye messages',
    category:'Group',
    ownerOnly:true,


    async execute(kaya,mek,from,args,prefix){

        try{

            const botJid=kaya.user.id;
            const status=await checkAdminOrOwner(kaya,from,mek.sender);

            if(!status.isBotOwner){
                return kaya.sendMessage(from,{text:"❌ Owner Only"});
            }


            const action=args.join(' ').toLowerCase();


            if(!action){
                return kaya.sendMessage(from,{
                    text:`⚙️ *BYE SETTINGS*\n\n${prefix}bye on\n${prefix}bye off\n${prefix}bye all on\n${prefix}bye all off\n${prefix}bye status`
                });
            }


            if(action==="on"){
                setSetting(from,'byeEnabled',true);
                return kaya.sendMessage(from,{text:"✅ Goodbye enabled"});
            }


            if(action==="off"){
                setSetting(from,'byeEnabled',false);
                return kaya.sendMessage(from,{text:"❌ Goodbye disabled"});
            }


            if(action==="all on"){
                setSetting(botJid,'byeGlobal',true);
                return kaya.sendMessage(from,{text:"✅ Global bye enabled"});
            }


            if(action==="all off"){
                setSetting(botJid,'byeGlobal',false);
                return kaya.sendMessage(from,{text:"❌ Global bye disabled"});
            }


            if(action==="status"){

                const global=getSetting(botJid,'byeGlobal',false);
                const group=getSetting(from,'byeEnabled',null);

                return kaya.sendMessage(from,{
                    text:`📊 *BYE STATUS*\n\nGlobal: ${global?"ON":"OFF"}\nGroup: ${group===null?"Global":group?"ON":"OFF"}`
                });
            }


        }catch(e){
            console.error("bye error:",e);
        }
    },


    async detect(kaya,update,from){

        try{

            if(update.action!=="remove" && update.action!=="leave") return;


            const botJid=kaya.user.id;

            const groupStatus=getSetting(from,'byeEnabled',null);
            const globalStatus=getSetting(botJid,'byeGlobal',false);


            if(groupStatus===false)return;
            if(groupStatus===null && !globalStatus)return;


            const metadata=await kaya.groupMetadata(from);


            for(const user of update.participants){

                const msg=
`👋 *GOODBYE*

👤 User: @${user.split("@")[0]}

👥 Group: ${metadata.subject}

😢 Goodbye, see you again!`;


                await kaya.sendMessage(from,{
                    text:msg,
                    contextInfo:{
                        ...getContextInfo(),
                        mentionedJid:[user]
                    }
                });

            }


        }catch(e){
            console.error("Bye detect error:",e);
        }
    }
};