# Field Broker for Roll2O recording

This project is a gateway between the Client and the Roll20Recorder. 
It receives the recordable players (GMs) relative position in the field canvas and pass it on to Roll20Recorder. 
As there can be multiple GMs in a Roll20 Game, it is possible to switch between recorded GMs.


## API
    + POST /  
        + Description : Update a player field.
        + Returns : OK_RECORDING if the player is being recorder, OK_STANDY if not.
        
    + POST /disconnect
        + Description : Alert the server that a GM is disconnecting from the Roll20 Game. If another GM is still 
            connected to the lobby, it will switch to his perspective. If no such GM exists, it will keep the last known
            position of the disconnected GM. 
            
    + POST /takeOver
        + Description: Ask to be recorded. This is used to maually switch between GMs. 

### Custom HTTP Codes

To allow some feedback to be returned to the client without using web sockets or other convoluted methods, some custom 
HTTP codes are used :
+ 215 -> OK_STANDBY : Used when the server registered the new field, and informs the client that this field is not the
    one being recorded.
+ 216 -> OK_RECORDING: Used when the server registered the new field, and inform the client that this field is the one
    being recorded. 



