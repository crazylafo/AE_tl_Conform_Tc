﻿/**
 * @fileoverview
 *
* @author Thomas Larforge <thomas.laforge@hrcls.tv>
* @Sync Footage by using TimeCode
* @version 1.12  --> Clean CallBack et rorganise functions and compatible windows correct the copy functiions with multiples properties.
* @version 1.13->debug time in of a layer
* @version 1.14 -->conform by duration
* @version 1.17-->auto conform mode first version
* @version 1.19--> *sort files with same names but differient extensions in same folder in timecodemode macos
*                             * add rotation param to transform param list in timecode and automatic mode
* @version 1.20 *import video files in timecodeMode
* @version 1.21 *debug videospec time values
     @version 1.22 *Send somes functions to the lib.jsxinc and transform the automatic method
  */                            




#strict on
#target aftereffects



(function (thisObj) {
    var version =  "0.1.22";
    var os = $.os;
    #include 'libtl_Conform_from_Tc.jsxinc'

    /**
    * Create a panel to display in the current host application.
    * @param {*} thisObj
    * @returns {Window|Panel} pal
    */
    var buildUI = function(thisObj) {
        var pal = (thisObj instanceof Panel) ? thisObj : new Window ("palette", "CONFO FROM TC Version "+version, undefined, {resizeable : true});
        var res =
         """Group{
            orientation: 'column',
            alignment: ['fill', 'fill'],
            alignChildren: ['fill','center'],
            descGrp: Group {
                orientation: 'row',
                alignment: ['fill', 'fill'],
                alignChildren: ['left','top'],
                logo: Image{}
                stxDescription: StaticText {text: "CONFO FROM TC\\nCopyright © 2018 Thomas Laforge", alignment: ['fill','top'], properties: {multiline:true}}
                }
                MainGrp: Group {
                orientation : 'column',
                alignement : ['fill', 'fill'],
                alignChildren:['left','top'],
                MethodeGrp : Panel {
                    text: 'Confomation Settings',
                    orientation: 'row',
                        rbOnlyTc : RadioButton {text : 'sync by TC'},
                        rbreelNameAndTimeCode : RadioButton {text : 'sync by TC and Reel Names'},
                        rbDuration : RadioButton {text: 'sync by Duration'},
                        rbAutomatic : RadioButton {text: 'sync by Detection (IN DEVELOPPEMENT)'}
                    }
                    stackMethodGrp :Group {
                            orientation: 'stack',
                            alignChildren: ['fill','fill'],
                                timeMethodGrp: Group {
                                orientation: 'column',
                                alignChildren: ['fill','fill'],
                                    impSettingsMethodGrp : Panel {
                                     text: 'Import Settings',
                                     orientation: 'column',
                                     alignChildren: ['fill', 'fill'],
                                     ddlSelectMethod: DropDownList { properties: {items : ['IMPORT FOOTAGE WITHOUT PRECOMPOSING', ' WATCH IN EXISTING PRECOMPS ONLY', 'IMPORT FOOTAGE AND PRECOMPOSE']}},
                                     precompGrp : Group{
                                        orientation: 'row',
                                        alignChildren: ['fill', 'center'],
                                        stxRef : StaticText  {text: "Precomps Name"},
                                        etxName : EditText  {text : "SHOT"},
                                        cbWatermark : Checkbox {text : 'add watermark'},
                                        }
                                        footageGrp: Group{
                                            orientation: 'row',
                                            btnSelectTCFolder : Button {text : 'Scan Folders'},
                                            }  
                                        }
                                        
                                    DurationGrp : Panel {
                                     text: 'Conformation by duration Settings',
                                     orientation: 'row',
                                         stxHandleIn : StaticText  {text: "Frame Handles InPoint"},
                                         etxHandleIn : EditText  {text : "25"},
                                         stxHandleOut : StaticText  {text: "Frame Handles OutPoint"},
                                         etxHandleOut : EditText  {text : "25"},
                                         cbFixedHandles : Checkbox  {text : 'Fixed Handles'},
                                    }
                                    SettingsGrp : Panel {
                                    text: 'transformation Settings',
                                    orientation: 'row',
                                        cbTimeWarp : Checkbox {text : 'Time Remaping'},
                                        cbFitToComp : Checkbox {text : 'Fit To Comp'},
                                        cbTransfrom : Checkbox {text : 'Transform Effects'},
                                        cbOpacity : Checkbox {text : 'Opacity Effects'}, 
                                    }
                                }
                           
                           DetectMethodGrp: Group {
                                orientation: 'column',
                                 alignChildren: ['fill','fill'],
                                  aeFolderGrp : Panel {
                                  text: 'AE sources Folder',
                                  orientation: 'row',
                                    stxAeFolder : StaticText  {text: "Folder in Project"},
                                    ddlAeFolder: DropDownList { alignment: ['fill','fill'], properties: {items : ['NONE']}},
                                    }
                                 DigicutGrp : Panel {
                                  text: 'Digicut Layer',
                                  orientation: 'row',
                                    stxDigicut : StaticText  {text: "Select Digicut's layer"},
                                    ddlDigicut: DropDownList {alignment: ['fill','fill'],  properties: {items : ['NONE']}},
                                    }
                                layerRefGrp : Panel {
                                  text: 'Edit Reference Layer (from AAF/XML files)',
                                  orientation: 'row',
                                    stxInputLayer : StaticText  {text: "index input"},
                                    ddlInputLayer: DropDownList {alignment: ['fill','fill'],  properties: {items : ['NONE']}},
                                    stxOutputLayer : StaticText  {text: "index Output"},
                                    ddlOutputLayer: DropDownList { alignment: ['fill','fill'], properties: {items : ['NONE']}},
                                    }
                                DetectRefGrp : Panel {
                                  text: 'Detection parameters. High value = slower detection',
                                  orientation: 'row',
                                 stxlimitDiff : StaticText  {text: "limit difference value"},
                                  txlimitDiff: EditText  {text : "12"},
                                  stxOutputLayer:  StaticText  {text: "Max percent around transform parameters"},
                                  txlimitAnalys: EditText  {text : "20"},
                                  cbTwarp: Checkbox {text : 'Use timeWarp'}, 

                                  }
                            }
                      }
                BtnGrp : Group {
                alignement : ['fill', 'fill'],
                orientation: 'row',
                btnStart : Button {text : 'Conform'},
                btnRefresh : Button {text : 'Refresh'},
                },
              }
        }""";

          
        pal.grp = pal.add(res);

        pal.onResizing = pal.onResize = function() {this.layout.resize();}
        pal.onShow = function() {pal.minimumSize = pal.size; }

        return pal;
    }

   


   
    function splitFileName(scannedFile){
        if (scannedFile != null) {
            if ($.os.indexOf ("Windows") !=-1){

                scannedFile = scannedFile.fsName;
                var dot = scannedFile.lastIndexOf(".");
                var delimitationStr = "\\";
                var slash = scannedFile.lastIndexOf (delimitationStr);
                }
            else {
                var dot = scannedFile.lastIndexOf(".");
                var slash =  scannedFile.lastIndexOf("/");
                }
    
            var fileExt =  scannedFile.substr( dot, scannedFile.length);
            var scannedFileWithoutExt = scannedFile.substr (0, dot);
            var parentFileFolder = scannedFileWithoutExt.substr (0, slash);
            var reelNameAndTimeCode = scannedFileWithoutExt.substr (slash+1,  scannedFileWithoutExt.toString().length);
            var reelName = "";
            var timeCode = 0;   
            var splitArray = [];
                     
            for ( var a=reelNameAndTimeCode.length-1; a>0; a--){
                //if char (a) is not a number --> end of the TimeCode description
                if ( isNaN(reelNameAndTimeCode.charAt(a) ) ||
                (reelNameAndTimeCode.charAt(a) === ".") ){
                    reelName = reelNameAndTimeCode.substring(0, (a+1) );
                    timeCode =  parseInt (reelNameAndTimeCode.substr ( ( a+1), dot), 10);
                    splitArray.push ( parentFileFolder,  reelName, timeCode, fileExt);
                    break;
                    }
                }
            return  splitArray;
            }  
        return null;
    }
      /**
     * @param {Folder} folder,   String} filters for  files support to input
     * @returns  Array{list of files })
     */
    function getFilesList (folder, filterArray) {
        // first method with terminal
            if (system.osName.toString().indexOf("Mac") !=-1)
            {
              var listFiles = listFilesMacOs (folder,filterArray);
            }
            else
            {
                var   filters = makeFilterList (filterArray); 
                var   listFiles =  scanFilesWithProgressBar(folder, filters);
                listFiles.sort(); // organize list items in alphabetical order
           }
            return listFiles;
        }
     /**
     * @param {Folder} folder,   String} filters for  files support to input
     * @returns  Array{ numSeuqences, Class { {Sequence matricule,  reelName, tc in, tc out, location pah, fileExtention, firstfileofthelist })
     */
    function listSequencesInFolders(folder,filterArray) {
            
            var hasMediaInfo = false;
             if (system.osName.toString().indexOf("Mac") !=-1)
            {
             hasMediaInfo = checkMediaInfo (folder) ;
            }
            
            listFiles = getFilesList (folder, filterArray);  //list Files in targget folder and organise it
            
            var sequenceNumber  =1; // list number of detected sequences
            var memoryTcIn =0; // temp memory of the first frame of the current sequence
            var memoryFirstFile =""; // temp memory of the first file  of the current sequence
            var sequencesListArray= [];  //array to list class of each sequences
             
            for (var i =0;  (i < listFiles.length-2) ; i ++) {
                
                var currrentFileExt = splitFileName(listFiles[i])[3];
                var nextFileExt = splitFileName(listFiles[i+1])[3];
                var currentFrameFolder = splitFileName(listFiles[i])[0];
                var nextFrameFolder = splitFileName(listFiles[i+1])[0];
                var currentFrameReelName = splitFileName(listFiles[i])[1];
                var nextFrameReelName =splitFileName(listFiles[i+1])[1] ;
                var currentTimeCode =  splitFileName(listFiles[i])[2];
                var nextTimeCode = splitFileName(listFiles[i+1])[2];
                 
                if (( i ==0) && (nextFrameReelName  ===currentFrameReelName)) {
                    memoryTcIn =currentTimeCode;
                    memoryFirstFile = listFiles[i];
                    }
                else if( ((currentTimeCode+1) != nextTimeCode ) ||   
                (currentFrameFolder  != nextFrameFolder) ||
                (currentFrameReelName != nextFrameReelName) ||
                (currrentFileExt  != nextFileExt) ||
                (i ==( listFiles.length-3))
                ){ // if jump cut in timecode  or if it's not longer in the same folder or no longer the same reel name or not the same fileEXt
                    sequence ={};
                    sequence.sequenceMatricule = sequenceNumber;
                    sequence.reelName = currentFrameReelName;
                    sequence.tcIn = memoryTcIn;
                    sequence.tcOut = currentTimeCode;
                    if (i ==( listFiles.length-3)) {
                        sequence.tcOut = currentTimeCode+2;
                        }
                    sequence.fileFolder =  currentFrameFolder ;
                    sequence.fileExtension = currrentFileExt;
                    sequence.firstFile = memoryFirstFile;
                    //sequence.date = new Date().FormatDate(memoryFirstFile);
                    sequencesListArray.push (sequence);

                    if (i <( listFiles.length-3)) {
                        memoryTcIn = nextTimeCode;
                        memoryFirstFile = listFiles[i+1];
                        sequenceNumber  +=1;
                        }
                    }
                }            
            sequencesListArray.unshift(sequenceNumber);
             
            if (system.osName.toString().indexOf("Mac") !=-1 && hasMediaInfo == true ){
                var filterMediaArray = [".mov"]; 
                mediaListArray = cmdListMediasInFolders(folder,filterMediaArray , sequencesListArray[0]);
                sequencesListArray[0] =  mediaListArray [0];
                for (var i =1; i<mediaListArray.length; i++){
                    sequencesListArray.push (mediaListArray[i])
                    }
                alert ((sequenceNumber) +" sequences and "+parseInt(mediaListArray[0]-sequenceNumber)+" Medias found in the folder" );
                }
            else { alert ((sequenceNumber) +" sequences found in the folder. \r Install MediaInfo to detect media files and go faster.");}
                                
            return sequencesListArray;

        }
    /**
    * @param {Item}  ActiveItem
    * @returns  Array {int, int,{int, int}
    */
    function getLayerTimeCodes(currentLayer) {
        if ((app.project.activeItem instanceof CompItem) &&(currentLayer instanceof AVLayer)) {
            var CurrentLayerIndex =parseInt (currentLayer.index) +1;
            var TemporalText = app.project.activeItem.layers.addText("");
            var textExpression = TemporalText.property ("Source Text");
            var compFrameRate = app.project.activeItem.frameRate;
            var layerFrameRate =0;
            try  {
                layerFrameRate = app.project.activeItem.layer(CurrentLayerIndex).source.frameRate;
                }
            catch (e) { };
            var layerTimeCode = [];
             
            textExpression.expression = 
                'layer = thisComp.layer ('+CurrentLayerIndex +'); \r'+
                'A = layer.sourceTime(layer.inPoint)* '+ layerFrameRate+'; \r'+
                'B = layer.sourceTime(layer.outPoint)* '+ layerFrameRate+';\r'+
                'C = layer.outPoint - layer.inPoint;\r'+
                
                'A+"&"+B+"&"+C';
            var textExpStr = textExpression.value.toString();

            var layerTcIn = textExpStr.substr (0,textExpStr .indexOf ("&"));
            var layerTcOut = textExpStr.substring(textExpStr.indexOf ("&")+1,  textExpStr.lastIndexOf ("&") );
            var layerDuration = textExpStr.substr (textExpStr.lastIndexOf ("&")+1,textExpStr.length -1);
            layerTimeCode= [parseInt(layerTcIn), parseInt(layerTcOut)-1];
            layerTimeCode.sort;
            layerTimeCode.push(layerDuration);
            textExpression.expression =
            'layer = thisComp.layer ('+CurrentLayerIndex +'); \r'+
            'D = layer.sourceTime(layer.startTime)* '+ layerFrameRate+'; \r'+
            'D';
            var textExpDStr = textExpression.value.toString();
            layerTimeCode.push(textExpDStr);
            TemporalText.remove();
            return layerTimeCode;
            }
        return null;
    }
    /**
    * @param {String} inputReelName,  {String} originalFootageName,  {int} inputTcIn,  {int} originalTcIn,  {int}  inputTcOut, {int}  originalTcOut, {bool}  boolReelNameMethod,  {bool} boolOriginalTimeRemap, int (framerate), (int)handeIn,  (int)handleOut
    * @returns   bool
    */
 
    function checkMergedFootages (inputReelName, originalFootageName, inputTcIn, originalTcIn, inputTcOut,  originalTcOut, originalDuration, SyncMethod, boolOriginalHasTimeRemap, layerFrameRate, handleIn, handleOut,  handlesFbool) {
        var boolNameMerge = true; // default don 't check reelname, so asume it's true
        var boolReturn = false;
        
        
         if (SyncMethod ==1 ||  SyncMethod ==2 ) { //reel name method and duration 
                if ( originalFootageName.indexOf(inputReelName) !=-1){
                    boolNameMerge = true;
                    }
                else {
                    boolNameMerge = false;
                    }
                }
         if (boolNameMerge== true ){
             var originalDurationFrames =  Math.abs  (parseInt(originalDuration*app.project.activeItem.frameRate));
                if (SyncMethod ==2 && (!handlesFbool)){
                    var newFootageDuration =  parseInt (inputTcOut) -  (parseInt (inputTcIn) ) ;
                    if ( originalDurationFrames <= newFootageDuration +parseInt(handleOut) &&
                         originalDurationFrames >= newFootageDuration -2*parseInt(handleIn))  {
                            boolReturn = true;
                        }
                    else {
                         boolReturn = false;
                        }
                    }
                 if (SyncMethod ==2 && handlesFbool){
                    var newFootageDuration = 1+ parseInt (inputTcOut) -  parseInt (inputTcIn) -parseInt(handleIn)-parseInt(handleOut);
                    
                    //alert (newFootageDuration +"_____"+originalDurationFrames);
                    if ( originalDurationFrames == newFootageDuration )  {
                            boolReturn = true;
                        }
                    else {
                         boolReturn = false;
                        }
                    }
                
           	else if ((parseInt (originalTcIn) >= parseInt (inputTcIn) ) &&   //firtst compare with [tcIn and tcIn + duration.]
                (parseInt (originalTcIn + (originalDuration*layerFrameRate)) <= parseInt (inputTcOut))) {
                    boolReturn = true;
                }
                else if ( (parseInt (originalTcIn) >= parseInt (inputTcIn)) && //then try with [tcIn and tcIn + tcOut]
                        (parseInt (originalTcOut) <= parseInt (inputTcOut))){
                 boolReturn = true;
                }
            else {
                boolReturn = false;
                }
            }
         return boolReturn;
        }
    /**
    * @param {}
    * @returns  {Array}
    */
    function searchFootageFilesInProject() {
        var footageFilesArray = [];
        var footageFileClass = {};
        for (var a =1; a <= app.project.numItems; a++) {
            if ((app.project.item(a) instanceof FootageItem) && (app.project.item(a).footageSource !="undefined"))  {
                try {
                    var footageFileClass = {};
                    footageFileClass.footageSource = app.project.item(a).mainSource.file;
                    footageFileClass.itemId = app.project.item(a).id;
                    footageFilesArray.push (footageFileClass);
                    }
                catch (e){
                    continue
                    }
                }
            }
        return footageFilesArray;
        }
    /**
    * @param {file}
    * @returns  {AVlayer}
    */
    function importSequenceFiles(inputFile, itemName, footageInProject) {
        var fileDetectedInProject = false; 
        var footageTarget = null;
        for (var a = 0; a < footageInProject.length; a++) {
           try {
                if  ((footageInProject[a]!= "undefined")&&(footageInProject[a].footageSource.toString() === inputFile.toString()) ){
                    for (b =1; b <= app.project.numItems; b++) {
                        if (app.project.item(b).id === footageInProject[a].itemId){
                            fileDetectedInProject = true;
                             footageTarget = app.project.item(b);
                            break;
                            }
                        }
                    }
                }
            catch (e) {
                continue
                }
            } 
        if (fileDetectedInProject == false ){
            var seqimportOptions = new ImportOptions  (File(inputFile));
            seqimportOptions.sequence = true;    // permet de reconnaitre une suite d'image
            seqimportOptions.forceAlphabetical = true;
            newImportedFootage = app.project.importFile (seqimportOptions);
            if (itemName !=null){
                newImportedFootage.name = itemName;
                }
            footageTarget = newImportedFootage;
            }
        return footageTarget;
        }
    /**
    * GET Layer property
    * @param {Layer} layer reference
    * @returns {class} : {int} layer.inpoint,   {int}  layer.outpoint,   {bool}  layer.timeremapenable,  {array} timeRemapKeys, {Array}  PositionsKey, {Array} SizeKeys; {Array} OpacityKey
    */
    function getLayerProperties (layer) {
        this.originalIndex = layer.index;
        this.originalInPoint = layer.inPoint;
        this.originalOutPoint =layer.outPoint;
        this.originalStartTime = layer.startTime;
        this.originalDuration =  layer.outPoint-layer.inPoint ;
          
        //check timeRemap
        if (layer.timeRemapEnabled) {
            this.timeremapEnabled = true;
            this.timeRemapArray = [];
            for (var a = 1;  a<= layer.property("Time Remap").numKeys;  a++) {
                var timeRemapKeys=  {};
                timeRemapKeys.remapKey = layer.property("Time Remap").keyValue(a);
                timeRemapKeys.timeKey =layer.property("Time Remap").keyTime(a);
                this.timeRemapArray.push (timeRemapKeys);
                }
            }
        else {
            this.timeremapEnabled = false;
            this.timeRemapArray  = null
            }
        //3D mode
        this.threeDMode = false; 
        if (layer.threeDLayer  == true) {
            this.threeDMode = true; 
            }
        //positions
        this.PositionsKeyArray= [layer.position.numKeys];   
        if (layer.position.numKeys ==0){
            this.PositionsKeyArray.push (layer.position.value[0], layer.position.value[1], layer.position.value[2]);
            }
        else {
            for (var a=1; a<= layer.position.numKeys; a++) {
                var positionsKeys = {};
                positionsKeys.x = layer.position.keyValue(a)[0];
                positionsKeys.y = layer.position.keyValue(a)[1];
                positionsKeys.z = layer.position.keyValue(a)[2];
                positionsKeys.timeKey = layer.position.keyTime(a);
                this.PositionsKeyArray.push (positionsKeys);
                }
            }
        //scale
        this.scaleKeyArray= [layer.scale.numKeys];   
        if (layer.scale.numKeys ==0){
            this.scaleKeyArray.push (layer.scale.value[0], layer.scale.value[1], layer.scale.value[2]);
            }
        else {
            for (var a=1; a<= layer.scale.numKeys; a++) {
                var scaleKeys = {};
                scaleKeys.x = layer.scale.keyValue(a)[0];
                scaleKeys.y = layer.scale.keyValue(a)[1];
                scaleKeys.z = layer.scale.keyValue(a)[2];
                scaleKeys.timeKey = layer.scale.keyTime(a);
                this.scaleKeyArray.push (scaleKeys);
                }
            }
        //rotation
         this.rotationKeyArray= [layer.rotation.numKeys];   
        if (layer.rotation.numKeys ==0){
            this.rotationKeyArray.push (layer.rotation.value);
            }
        else {
            for (var a=1; a<= layer.rotation.numKeys; a++) {
                var rotationKeys = {};
                rotationKeys.x = layer.rotation.keyValue(a);
                rotationKeys.timeKey = layer.rotation.keyTime(a);
                this.rotationKeyArray.push (rotationKeys);
                }
            }
        //opacity
        this.opacityKeyArray= [layer.opacity.numKeys];
        if (layer.opacity.numKeys ==0){
            this.opacityKeyArray.push (layer.opacity.value);
            }
        else {
            for (var  a=1; a<= layer.opacity.numKeys; a++) {
                var opacityKeys = {};
                opacityKeys.opValue = layer.opacity.keyValue(a);
                opacityKeys.timeKey = layer.opacity.keyTime(a);
                this.opacityKeyArray.push ( opacityKeys);
                }
            }
        }
    /**
    * CopyLayer property from reflayer to newLayer.
    * @param (layer) LayerRefrence}  (int) LayerReferenceTCin,  (int) LayerReferenceTCStart, (int) LayerReference Duration, (layer) newLayer, (int) newLayerTCIn, (bool) timeRemapEnable, (bool) OpacityEnable, (bool) FitToCompEnable, (bool)  transformEffectEnable) 
    * @returns {void}
    */              
    function copyLayerProperties(referenceLayer, referenceLayerTcIn, referenceLayerStartingTc, referenceLayerDuration, newLayer, newLayerTcIn,boolsParam,  MethodSync, handleIn ) {
            var originalParams = new getLayerProperties (referenceLayer);  //get class of in and out point of the original footage

            // check if  original inPoint < original OutPoint and so Apply Timereverse or not on the new layer
            var inPoint = 0;
            var outPoint =0;
            var boolTimeInverse = false;
            
            if (originalParams.timeremapEnabled == true ){
                 inPoint = originalParams.originalInPoint;
                 outPoint = parseFloat (inPoint) +parseFloat (referenceLayerDuration);
                }
            else {
                if (originalParams.originalInPoint <= originalParams.originalOutPoint ){
                    inPoint = originalParams.originalInPoint;
                    outPoint =originalParams.originalOutPoint;
                    }
                else {
                     inPoint = originalParams.originalOutPoint;
                     outPoint = originalParams.originalInPoint;
                     boolTimeInverse = true; 
                    }
                }
            if (MethodSync ==2)
            {
                newLayer.startTime =  originalParams.originalInPoint -  (handleIn/app.project.activeItem.frameRate);
                newLayer.inPoint =inPoint;  // apply inpoint to the layer
                newLayer.outPoint = outPoint.toFixed(2) ; // apply outpoint to the layer
                
            }
            else
            {
                 try {
                newLayer.startTime =originalParams.originalInPoint - ((referenceLayerTcIn - newLayerTcIn)/(app.project.activeItem.frameRate));
                newLayer.inPoint =inPoint;  // apply inpoint to the layer
                newLayer.outPoint = outPoint.toFixed(2) ; // apply outpoint to the layer
                }catch (e) {alert (e)}
                
            }
            if (boolTimeInverse) { // if time Reverse enable on original then apply it
                newLayer.selected = true;
                app.executeCommand (app.findMenuCommandId ("Time-Reverse Layer"));
                newLayer.selected = false;
                }
            
            // apply timeremap effects if checkbox selected and original footage has timeremap
            if ( ( boolsParam.boolTimeWarp) && (originalParams.timeremapEnabled == true ) ) {   
                newLayer.timeRemapEnabled = true;
                newLayer.property("Time Remap").removeKey(1);
                var diffTime =  newLayer.startTime  -  originalParams.originalStartTime; // diff timing befween the native and the imported footage
                for (var k =0; k< originalParams.timeRemapArray.length; k++) {
                    try{
                        newLayer.property("Time Remap").setValueAtTime ( originalParams.timeRemapArray[k].timeKey, originalParams.timeRemapArray[k].remapKey - diffTime);
                        }
                    catch (e){};
                    }
                try {
                    newLayer.property("Time Remap").setValueAtTime (newLayer.inPoint, referenceLayer.property("Time Remap").valueAtTime (newLayer.inPoint, false) - diffTime);
                    newLayer.property("Time Remap").setValueAtTime (newLayer.outPoint, referenceLayer.property("Time Remap").valueAtTime (newLayer.outPoint, false) - diffTime);
                    }
                catch (e) {}
                }
            
            //apply opacity effects if dropbox selected
            if (boolsParam.boolOpacity) {
                if (originalParams.opacityKeyArray[0] ==0) {
                    newLayer.opacity.setValue = originalParams.opacityKeyArray[1];
                    }
                else {
                    for (k =1; k <originalParams.opacityKeyArray.length ; k++) {
                        newLayer.opacity.setValueAtTime (originalParams.opacityKeyArray[k].timeKey, originalParams.opacityKeyArray[k].opValue)
                        }
                    }
                }
            
            //fit to comp layer if dropboxselected
            if(boolsParam.boolFitToComp) {
                newLayer.selected = true;
                app.executeCommand (app.findMenuCommandId ("Fit to Comp Width"));
                newLayer.selected = false;
                }
            
            // apply transform  effects if dropbox selected
            if (boolsParam.boolTransform) {

                if (originalParams.threeDMode == true) {    //if the original footagehas  3d proeprties   then the imported layer has to be in 3d
                     newLayer.threeDLayer  = true; 
                     }
                //position
                if (originalParams.PositionsKeyArray[0] == 0) {
                    newLayer.position.setValue([originalParams.PositionsKeyArray[1],originalParams.PositionsKeyArray[2] ,originalParams.PositionsKeyArray[3] ] );
                    }
                else{
                    for ( var k =1; k< originalParams.PositionsKeyArray.length;  k++) {
                       
                        newLayer.position.setValueAtTime (originalParams.PositionsKeyArray[k].timeKey, [originalParams.PositionsKeyArray[k].x,originalParams.PositionsKeyArray[k].y,  originalParams.PositionsKeyArray[k].z]);
                        }
                    }
                
                //scale
                var nativeScale = [newLayer.scale.value [0] /100, newLayer.scale.value [1] /100, newLayer.scale.value [2] /100];
                if (originalParams.scaleKeyArray[0] == 0) {
                     newLayer.scale.setValue([originalParams.scaleKeyArray[1]*nativeScale[0],originalParams.scaleKeyArray[2]* nativeScale[1],originalParams.scaleKeyArray[3]* nativeScale[2]]);
                                                        
                    }
                else {
                    for (var k =1; k< originalParams.scaleKeyArray.length;  k++) {
                        newLayer.scale.setValueAtTime (originalParams.scaleKeyArray[k].timeKey, [originalParams.scaleKeyArray[k].x* nativeScale[0], originalParams.scaleKeyArray[k].y *nativeScale[1],originalParams.scaleKeyArray[k].z *nativeScale[2] ]);                                                                                                    
                        }
                    }
                  //rotation
                if (originalParams.rotationKeyArray[0] == 0) {
                     newLayer.rotation.setValue(originalParams.rotationKeyArray[1]);                                 
                    }
                else {
                    for (var k =1; k< originalParams.rotationKeyArray.length;  k++) {
                        newLayer.rotation.setValueAtTime (originalParams.rotationKeyArray[k].timeKey, originalParams.rotationKeyArray[k].x);                                                                                                    
                        }
                    }
                }
            originalParams.delete;
            }
   /**
    * getPrecomp InputsTime Codes (in activeItem)
    * @param {compItems} precomp to detect in activeItem
    * @returns {Array} [ {LayersInputs}]
    */
    function getPrecompInputsTimeCodes ( projectItem) {
        var layersArray = [];  //get information if the precomp is already used in the activeitem (main compo) and get the in and out point, in order to not import the precomp with same in/out point twice 
        for (var a=1; a<= app.project.activeItem.numLayers; a++)  {
             if (app.project.activeItem.layer(a).name ===  projectItem.name) {
                //layerPoints.startTime = app.project.activeItem.layer(a).startTime;//layerPoints.outPoint = app.project.activeItem.layer(a).outPoint ;
                inPoint = app.project.activeItem.layer(a).inPoint ;
                layersArray.push (inPoint);
                }
             }
        return  layersArray;
        }
    /**
    * GetprecompsList
    * @param {string precomps base name}
    * @returns {Array} [numPrecomps, {ClassPrecomps}]
    */
    function getPrecompsList (PrecompsName) {
         var precompsArray = [];
         var NumPrecomps =0;
         
         for (var a =1; a <= app.project.numItems; a++) {
             if ((app.project.item(a) instanceof CompItem) && (app.project.item(a).name.indexOf (PrecompsName+"_") ==0 ) ){
                var nameMatriculePreIsolate = app.project.item(a).name.substr (app.project.item(a).name.indexOf ("_")  +1,app.project.item(a).name.length -1);
                var nameMatricule =  nameMatriculePreIsolate.toString().substr  (0, nameMatriculePreIsolate.toString().indexOf ("_") );
                NumPrecomps +=1;
                var precompDescription = {};
                precompDescription.name = app.project.item(a).name;
                precompDescription.id = app.project.item(a).id;
                precompDescription.matricule = nameMatricule;
                precompDescription.frameRate = app.project.item(a).frameRate;
                precompDescription.tcIn = app.project.item(a).displayStartTime*precompDescription.frameRate;
                precompDescription.NumFrames= app.project.item(a).duration*precompDescription.frameRate;
                precompDescription.tcOut = precompDescription.tcIn  + precompDescription.NumFrames ;
                precompDescription.layersArray = getPrecompInputsTimeCodes(app.project.item(a));
                precompsArray.push (precompDescription);
                }
            }
        precompsArray.unshift (NumPrecomps);
        return precompsArray;
        }

     /**
    * precomposeNewLayer    (and update the precompList )
    * @param {Array} existing precomp Array, {item} refrenceLayer, {string} precompname, {folder} folderItem to stock precomp  
    * @returns {class}   description of the precomp, {int} number of the new precomp
    */
    function precomposeNewLayer (compsArray, referenceLayer, precompsName,precompsFolder) {
        // find the num of precomp for the new precomp name
        var LastMatricule =parseInt (compsArray [0]);
        if (LastMatricule  > 0) {
            var newNumPrecomp = parseInt(LastMatricule) +1 ;
            var newMatricule = newNumPrecomp* 10 ;
            }
        else {
            var newNumPrecomp = 1;
            var newMatricule = 10;
            }
        if ( newMatricule <100) {
            newMatricule = "0"+newMatricule;
            }
        // precompose the item
        var currentPrecompName = precompsName +"_"+newMatricule+"_001" ;
        var newLayerPreComp =app.project.activeItem.layers.precompose([1], currentPrecompName, false)     //precompose importedItem
        var precompItem =  findCompWithName (currentPrecompName) //identfy the precomp item in the root folder
        precompItem.parentFolder =precompsFolder; // put the precomp in the precomp folder
        // create class info about the  new precomp
        var precompDescription = {};
        precompDescription.name  =currentPrecompName;
        precompDescription.id = newLayerPreComp.id;
        precompDescription.matricule = newMatricule ;
        precompDescription.frameRate =  precompItem.frameRate;
        precompDescription.tcIn =  precompItem.displayStartTime*precompDescription.frameRate;
        precompDescription.NumFrames=  precompItem.duration*precompDescription.frameRate;
        precompDescription.tcOut = precompDescription.tcIn  + precompDescription.NumFrames ;
        precompDescription.layersArray = [];
        var layerPoints = {};
        layerPoints.startTime = referenceLayer.startTime;
        layerPoints.inPoint = referenceLayer.inPoint ;
        layerPoints.outPoint = referenceLayer.outPoint ; 
        precompDescription.layersArray.push (layerPoints);
        
        return [precompDescription, newNumPrecomp]
        }        
 
    
    /**
    * @param  {none}
    * @returns {int}   matricule of the method )
    */
    function  checkMethodSync (){
        switch (true) {
            case panel.grp.MainGrp.MethodeGrp.rbOnlyTc.value :
                return 0;
                break;
            case panel.grp.MainGrp.MethodeGrp.rbreelNameAndTimeCode.value :
                return 1;
                break;
            case panel.grp.MainGrp.MethodeGrp.rbDuration.value :
                return 2;
                break;
            case panel.grp.MainGrp.MethodeGrp.rbAutomatic.value :
                return 3;
                break;
                   
            default :
                return 0;
                }
            }
     
     function conformLayerbyTime (index , footageInProject, method, newLayerName, targetSequences, precompsFolder , precompsName,boolsParam, footageFolder, handlesParam,methodmatricule, compsArray){
            
            var i = index;
            var boolItemsImported =false;
            var boolImportedPrecomps =false;
            var boolGeneratedPrecomps =false;
            var boolIncrement = false;
            
           var currentLayerFrameRate = app.project.activeItem.layer(i).source.frameRate;
             if ((app.project.activeItem.layer(i).name.indexOf (newLayerName.toString() ) != -1)||(app.project.activeItem.layer(i).name.indexOf (precompsName.toString())!=-1)|| (app.project.activeItem.layer(i).name.indexOf ("Solid") !=-1)){return}   // be sur that  layer (i) is not a conformed layer or a solid 
             var footageInCompTC = getLayerTimeCodes ( app.project.activeItem.layer(i));
             var foundInPrecompList =0;
             var precompAlreadyImported =false;
             if (methodmatricule != 0 ){     // Precomps method if activated
                 //search if the footage is present in the existing precomps
                 for (var j=1; j < compsArray.length;j++){
                     var footageInCompOut = footageInCompTC[0] + (footageInCompTC[2]*currentLayerFrameRate); // force the outpoint because of timeremap values conflict
                     if (( compsArray[j].tcIn <= footageInCompTC[0] )&& (compsArray[j].tcOut >= footageInCompOut ) ){
                        for (var k=0; k<compsArray[j].layersArray.length; k++) {
                            var targetInPoint = parseFloat (compsArray[j].layersArray[k]);
                            if (targetInPoint.toFixed(2)  == app.project.activeItem.layer(i).inPoint.toFixed(2) ) {
                                precompAlreadyImported = true;
                                foundInPrecompList = 1;
                                var confoReturn = {};
                                confoReturn.compsArray = compsArray;
                                confoReturn.boolImportedPrecomps = boolImportedPrecomps;
                                confoReturn.boolImportedItems =boolItemsImported ;
                                confoReturn.boolGeneratedPrecomps = boolGeneratedPrecomps;
                                confoReturn.boolIncrement= boolIncrement;
                                return confoReturn
                                }
                            }
                        if ( foundInPrecompList == 1){
                            return;
                            }
                        if (precompAlreadyImported == false){
                          
                            var newFootage= app.project.itemByID(compsArray[j].id);
                             if (newFootage){ 
                                var newLayer =app.project.activeItem.layers.add(newFootage);
                                newLayer.label = 11;
                                boolIncrement = true;  
                                i =i+1;//new layer added on the top of the composition so increment i
                                try {
                                    copyLayerProperties(app.project.activeItem.layer(i), footageInCompTC [0], footageInCompTC[3],footageInCompTC[2], newLayer, compsArray[j].tcIn, boolsParam, method ,handlesParam.handleIn); 
                                    foundInPrecompList =1;
                                    boolImportedPrecomps =1;
                                    return;
                                    }
                                catch (e) {
                                    continue;
                                    }
                                newLayer.selected = false;
                                }
                            }
                        }
                     }
                 }
             if (!targetSequences) {
                 alert ("select a source Folder"); 
                  var confoReturn = {};
                    confoReturn.compsArray = compsArray;
                    confoReturn.boolImportedPrecomps = boolImportedPrecomps;
                    confoReturn.boolImportedItems =boolItemsImported ;
                    confoReturn.boolGeneratedPrecomps = boolGeneratedPrecomps;
                    confoReturn.boolIncrement= boolIncrement;
                    return confoReturn
            };
             if ((targetSequences !=null)&&
                (precompAlreadyImported == false)&&
                (methodmatricule !=1) ){
                var boolTimeRemap = false;
                if (app.project.activeItem.layer(i).timeRemapEnabled) {
                        boolTimeRemap =true;
                        }   
                var sourceFile = getCleanLayerSourceFile (app.project.activeItem.layer(i));    
                for (var j =1; j < targetSequences.length; j++) {  
                    var compareFootage = checkMergedFootages (targetSequences[j].reelName, sourceFile, targetSequences[j].tcIn, footageInCompTC[0], targetSequences[j].tcOut, footageInCompTC[1], footageInCompTC[2], method, boolTimeRemap, currentLayerFrameRate, handlesParam.handleIn, handlesParam.handleOut, handlesParam.handlesFbool);                                                                                                             
                    if ( compareFootage === true) { 
                        var importExternalFootage = importSequenceFiles (targetSequences[j].firstFile,targetSequences[j].reelName,footageInProject ); //check if the file already in project 's footage  
                        var newLayer = app.project.activeItem.layers.add (importExternalFootage);  //input item in the composition
                        
                        importExternalFootage.parentFolder =footageFolder ;
                        newLayer.name = newLayer.name + newLayerName.toString();
                        boolItemsImported = true; //increment var number of imported items
                        boolIncrement = true;   // for the parent function
                        i = i+1;//new layer added on the top of the composition so increment index
                        if  (panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.impSettingsMethodGrp.ddlSelectMethod.selection !=0) {
                            var newPrecomp =    precomposeNewLayer (compsArray,app.project.activeItem.layer(i), precompsName,precompsFolder) ;
                            newLayer.name =  newPrecomp[0].name;
                            boolGeneratedPrecomps  = true;
                            compsArray.splice (0, 1, newPrecomp[1]);
                            compsArray.push (newPrecomp[0]);
                            }
                        newLayer.label = 11;
                        copyLayerProperties(app.project.activeItem.layer(i), footageInCompTC[0], footageInCompTC[3], footageInCompTC[2],newLayer, targetSequences[j].tcIn, boolsParam, method, handlesParam.handleIn);
                        }
                    } 
                }
            var confoReturn = {};
            confoReturn.compsArray = compsArray;
            confoReturn.boolImportedPrecomps = boolImportedPrecomps;
            confoReturn.boolImportedItems =boolItemsImported ;
            confoReturn.boolGeneratedPrecomps = boolGeneratedPrecomps;
            confoReturn.boolIncrement= boolIncrement;
            return confoReturn
         }
     /**
    * conformByTime  main function to conform by timecode or duration
    * apply conform by timecode method /return void
    */
    function conformByTime ( method, newLayerName, targetSequences, precompsFolder , precompsName,boolsParam, footageFolder, handlesParam,methodmatricule){

        // var for the ending result
        var numItemsImported =0;
        var numImportedPrecomps =0;
        var numGeneratedPrecomps =0;
        
        //For the genereted precomps array
        var compsArray =[];
        if (methodmatricule !=0) {     //list precomp if precomp method by precomp on generate precomps is On.
            compsArray = getPrecompsList (precompsName.toString());
            }
        var footageInProject =searchFootageFilesInProject();
        for (var i =app.project.activeItem.numLayers ; i >0 ; i --) { //STARTING SCAN OF EACH COMP ITEMS
           var conform = conformLayerbyTime (i ,footageInProject,method, newLayerName, targetSequences, precompsFolder , precompsName,boolsParam, footageFolder, handlesParam,methodmatricule, compsArray);
            if (methodmatricule !=0){
                 tempArray  =[]
                try{
                     tempArray = conform.compsArray;
                    }
                catch(e) {
                    tempArray =compsArray  ;
                    compsArray = tempArray;
                    }
                }
           if (conform.boolImportedPrecomps == true) {

               numImportedPrecomps +=1;
               }
            if (conform.boolImportedItems == true) {

               numItemsImported +=1;
               }
            if (conform.boolGeneratedPrecomps == true) {

               numGeneratedPrecomps +=1;
               }
            if (conform.boolIncrement == true) {
               i +=1;
               }
                 
            }
        alert (numItemsImported + " files imported, "+numGeneratedPrecomps + " generated precomps, "+  numImportedPrecomps + " imported precomps" );
        }
       


    function addSampleFx (activeComp, fxName,layerdigicutIndex){
                        //create and param  Solid FX
                        var SolidEffect =activeComp.layers.addSolid( [1,1,1], "SampleFx", activeComp.width, activeComp.height,activeComp.pixelAspect, activeComp.duration);
                        var sampleFx = SolidEffect.Effects.addProperty (fxName);

                        // Param layer 1 = DIGICUT
                        sampleFx.property(2).setValue (layerdigicutIndex);
                        
                        //comparatif = substract
                        sampleFx.property(4).setValue(3);
                        
                        //return ParamLayer2 selection
                        var paramLayerTwoAdress = sampleFx.property(3);
                        //return ParamLayer1 TimeOffset & tranform properties adress
                        var layerOneProp = [sampleFx.property(7), sampleFx.property(8), sampleFx.property(9) ] //timeoffset transform and scale adresses
                        //return ParamLayer2 TimeOffset & tranform properties adress
                        var layerTwoProp = [sampleFx.property(12), sampleFx.property(13),sampleFx.property(14)] ; //timeoffset transform and scale adresses

                        
                        //return lumaResultAdress
                        var lumaAdress = sampleFx.property(18);
                        //return R/G/B access
                        var colorsAdress = [sampleFx.property(19),sampleFx.property(20),sampleFx.property(21)];
                        //return  link to the checkbox
                        var cbRefreshAdress =  sampleFx.property(22);
                    
                        return [sampleFx, paramLayerTwoAdress,layerOneProp, layerTwoProp,lumaAdress, colorsAdress, cbRefreshAdress]
        }
    function getItemProperties(item){
        var itemProperties = {};
        itemProperties.name = item.name;
        itemProperties.index =  item.index;
        itemProperties.id = item.id; 
        itemProperties.duration = item.duration;
        if ( item.duration == 0)
        {
            itemProperties.boolStillFrame = true;
            itemProperties.frameRate = 0;
        }
        else
        {
            itemProperties.boolStillFrame = false;
            itemProperties.frameRate = item.frameRate;
        }
        return itemProperties;
        }
    function getFolderListItems ( folderItem) {
        var listItems = [];
        if (folderItem instanceof FolderItem)
        {
            for (var i =1; i<=   folderItem.numItems; i++)
            {
                if ( ((folderItem.item(i).hasAudio == true) && (folderItem.item(i).hasVideo == false)) ) 
                {continue} // if it's an audiofile only -> slkip it
                else if (folderItem.item(i) instanceof FolderItem)
                {
                    var subFolderItemsProperties =getFolderListItems(folderItem.item(i));
                    for (var j = 0; j <subFolderItemsProperties.length; j++)
                    {
                        listItems.push(subFolderItemsProperties[j]);
                    } 
                }
                else 
                {   
                     var itemProperties =  getItemProperties(folderItem.item(i));
                     listItems.push(itemProperties);
                 }
            }
            //Sort ListItems
            //by duration,
            //if 0--> to the end;  
        }
        return listItems;
    	}
    // List Layer edit reference and properties
     function getLayerRefList (layerRefIn,layerRefOut){
                  var layerRefList = [];
                   for (var i= layerRefIn; i <= layerRefOut; i++)
                   {
                       var layer =app.project.activeItem.layer(i);
                       var originalParams = new getLayerProperties(layer);
                       layerRefList.push(originalParams);
                   }
                   return  layerRefList;  
        }
         //Analys frame
     function callAnalys (sampleFxArray){
            //assuming that the fxSample isthe first layer and sample FX as 1st effect
            sampleFxArray[1].setValue(2);
            sampleFxArray[6].setValue (1);
            var memoryWait =0;
            
            while (sampleFxArray[6].value == 1)
            {
                memoryWait ++;
                if (sampleFxArray[6].value == 0)
                {
                    break;
                }
            }
        var rgbAdress =sampleFxArray[5];
        var rgb = rgbAdress[0].value +rgbAdress[1].value +rgbAdress[2].value;
        //alert (rgb);
        var luma =sampleFxArray[4].value;
        
        return [rgb, luma]
        }

 	function applyDetection (layerdigicutIndex, maxDiff,MaxAround,timeWarpbool, activeComp, sampleFxArray, folderIndex,folderItemsList,layerRefIn, layerRefOut){
 		 var layerRefList =  getLayerRefList(layerRefIn,layerRefOut);
 		 //value for reccurrent preset like handless
        var valueReferences = {}
        valueReferences.handles = 25;
        var tempWindow = new Window('palette');
        tempWindow.info = tempWindow.add("staticText",[0,0,200,50], "Calculating");
        tempWindow.progressScan = tempWindow.add("progressBar", undefined, 0,  layerRefList.length*folderItemsList.length);
        tempWindow.progressScan.preferredSize.width = 300;
        tempWindow.show();
    
        for (var i =0; i < layerRefList.length; i++)
           {

                for (var j=0; j<folderItemsList.length; j++)
                {
                    tempWindow .progressScan.value = (i+1)*(j+1);
                    sampleFxArray[3][0].setValue(0);
                    sampleFxArray[3][2].setValue(100);
                    sampleFxArray[3][1].setValue([activeComp.width/2,activeComp.height/2]);
                    
                    if ((timeWarpbool == false) && (folderItemsList[j].duration < layerRefList[i].originalDuration))
                    {
                       j++;
                    }
                    else
                    {
                        layerValid = false;
                        testLayer = activeComp.layers.add(app.project.itemByID(folderItemsList[j].id));
                        testLayer.moveAfter(activeComp.layer(2)); //Keep SampleFx layer on the top
                        referenceLayerIndex =   layerRefList[i].originalIndex+1;
                        testLayer.startTime = layerRefList[i].originalInPoint;
                        
                        //Call Analys   //return [sampleFx,     paramLayerTwo   Adress,layerOneProp,    layerTwoProp,   lumaAdress, colorsAdress, cbRefreshAdress]
                 
                         var returnanalysStepOne = callAnalys (sampleFxArray);
                         
                         //SI VALIDER
                           if ( returnanalysStepOne[0] <=maxDiff )
                           {
                               alert ("plan trouvé");
                               layerValid = true;
                               i++
                           }
                         
                         //SINON FIT TO DIGICUT SIZE
                         var testSize = (activeComp.layer( layerdigicutIndex+1).width/testLayer.width)*100;
                         sampleFxArray[3][2].setValue(testSize);  //access to the sampleFX param to resize the layer 2
                           var returnanalysStepTwo = callAnalys (sampleFxArray);
                           if ( returnanalysStepTwo[0] <= maxDiff )
                           {
                               alert ("plan trouvé");
                               layerValid = true;
                               i++
                           }
                            
                            else if (returnanalysStepTwo[1] < 0.050 ) // luma diff limit   
                            {
                                var ArrayTimesOffsetToTest = [];
                                if ( folderItemsList[j].duration-(valueReferences.handles*2/25) >= layerRefList[i].originalDuration)
                                {
                                        ArrayTimesOffsetToTest.push(valueReferences.handles);
                                }
                                var timeMini = -25*(folderItemsList[j].duration-layerRefList[i].originalDuration);
                                var timeMaxi = 25*(folderItemsList[j].duration-layerRefList[i].originalDuration);
                                for (var k=timeMini ; k<=  timeMaxi; k++) 
                                {
                                     ArrayTimesOffsetToTest.push(k);   
                                }

                                //SCALE ARRAYOF POSSIBILITIES
                                var scalePrecision = 1;  
                                var minScale = parseFloat( ( sampleFxArray[3][2].value - parseFloat ( sampleFxArray[3][2].value*MaxAround/100))/ scalePrecision); 
                                var maxScale = parseFloat (( sampleFxArray[3][2].value + parseFloat ( sampleFxArray[3][2].value*MaxAround/100))/ scalePrecision);
                                var ArrayScaleValues =[];
                                for (var k= maxScale; k>minScale; k--)
                                { 
                                     ArrayScaleValues.push (k* scalePrecision);
                                }

                                //POSITION ARRAY OF POSSIBILITES
                                 var positionPrecision = 1;
                                 var minPosX =    ( sampleFxArray[3][1].value[0] - parseFloat ( sampleFxArray[3][1].value[0]*0.5*MaxAround/100))/ positionPrecision; 
                                 var maxPosX =   ( sampleFxArray[3][1].value[0] + parseFloat ( sampleFxArray[3][1].value[0]*0.5*MaxAround/100))/ positionPrecision; 
                                 var posXArray =[];
                                  for (var k= maxPosX ; k>minPosX; k--)
                                {
                                     posXArray.push (k*positionPrecision);
                                }

                                 var minPosY =    (sampleFxArray[3][1].value[1] - parseFloat (sampleFxArray[3][1].value[1]*0.5*MaxAround/100))/ positionPrecision; 
                                 var maxPosY =  (sampleFxArray[3][1].value[1] + parseFloat (sampleFxArray[3][1].value[1]*0.5*MaxAround/100))/ positionPrecision;
                                 var posYArray =[];
                                 for (var k= maxPosY ; k>minPosY; k--)
                                {
                                      posYArray.push (k*positionPrecision);
                                }
                                //TO DO TO GO FASTER
                                // ANALYSE  T OFFSET  25   T OFFSET 0  TMIN    TMAX
                                //ANALYSE SCALE FIT --   100%  -- LAYER REF (SCALE*
                                //ANALYS POS  POS INI     POSXMINPOSYINI    POSXINIPOSYMIN   POSXMINPOSYMIN 
                                

                                for (var k=0; k< ArrayTimesOffsetToTest.length; k++)  //loop with  timeoffset possibilites array
                                {
                                    for (var L=0; L<ArrayScaleValues.length; L++) //loop with  scale possibilites array
                                    {
                                        for (var m=0; m <posXArray.length ; m++)   //loop with y possibilites
                                        {
                                            for (var n=0; n<posYArray.length; n++)  //loop with x possibilites).
                                            {
                                                 sampleFxArray[3][0].setValue(ArrayTimesOffsetToTest[k]);
                                                 sampleFxArray[3][2].setValue(ArrayScaleValues[L]);
                                                 sampleFxArray[3][1].setValue([posXArray[n],posYArray[m]]);
                                                  tempWindow.info = tempWindow.add("staticText",[0,0,200,50], "time offset: "+ArrayTimesOffsetToTest[k]+"   scale value: "+ArrayScaleValues[L]+"    position: "+posXArray[n]+":"+posYArray[m]);
                                                 var returnanalysStepThree = callAnalys (sampleFxArray);
                                                   if ( returnanalysStepThree[0] <= maxDiff )
                                                   {
                                                       alert ("plan trouvé");
                                                       layerValid = true;
                                                       activeComp.layer(2).inPoint += k;
                                                       activeComp.layer(2).scale= L/scalePrecision;
                                                       activeComp.layer(2).position[0]= m;
                                                       activeComp.layer(2).position[1]= n;
                                                       i++
                                                   }
                                            }
                                        }
                                    }
                                }
                            }
                               
                            if (layerValid ==false)
                            {
                                activeComp.layer(2).remove()
                                 j++;
                            }
                      }
                       
                } 
           }
 		}
     /**
 	}
    * Manage callback for UI panel
    * @param {Window|Panel} panel
    */
    function callbackUI(panel) {
        //default
        panel.grp. MainGrp.MethodeGrp.rbOnlyTc.value = 1;
        panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.impSettingsMethodGrp.ddlSelectMethod.selection = 2;
        if (app.project.activeItem)
        {
            panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.etxHandleIn.text = app.project.activeItem.frameRate.toString();  
            panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.etxHandleOut.text = app.project.activeItem.frameRate.toString(); 
        }

        
        var newLayerName = "_CONFO_TC";
        //stack
        panel.grp. MainGrp.MethodeGrp.rbOnlyTc.onClick= function() {
              panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.visible = true;
              panel.grp.MainGrp.stackMethodGrp.DetectMethodGrp.visible = false;
            panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.etxHandleIn.enabled= false;
            panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.stxHandleIn.enabled= false;
            panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.etxHandleOut.enabled = false;
            panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.stxHandleOut.enabled = false;
            panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.cbFixedHandles.enabled = false;
             }
        panel.grp. MainGrp.MethodeGrp.rbreelNameAndTimeCode.onClick= function() {
             panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.visible = true;
             panel.grp.MainGrp.stackMethodGrp.DetectMethodGrp.visible = false;
            panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.etxHandleIn.enabled= false;
            panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.stxHandleIn.enabled= false;
            panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.etxHandleOut.enabled = false;
            panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.stxHandleOut.enabled = false;
            panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.cbFixedHandles.enabled = false;
             }
        panel.grp. MainGrp.MethodeGrp.rbDuration.onClick= function() {
             panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.visible = true;
             panel.grp.MainGrp.stackMethodGrp.DetectMethodGrp.visible = false;
                panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.etxHandleIn.enabled= true;
                panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.stxHandleIn.enabled=  true;
                panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.etxHandleOut.enabled = true;
                panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.stxHandleOut.enabled =  true;
                panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.cbFixedHandles.enabled = true;
             
             }
        panel.grp. MainGrp.MethodeGrp.rbAutomatic.onClick= function() {
             panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.visible = false;
             panel.grp.MainGrp.stackMethodGrp.DetectMethodGrp.visible = true;

             }

        panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.etxHandleIn.enabled= false;
        panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.stxHandleIn.enabled= false;
        panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.etxHandleOut.enabled = false;
        panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.stxHandleOut.enabled = false;
        panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.cbFixedHandles.enabled = false;

        panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.visible = true;
        panel.grp.MainGrp.stackMethodGrp.DetectMethodGrp.visible = false;
            

        var folderSourceddl = panel.grp.MainGrp.stackMethodGrp.DetectMethodGrp.aeFolderGrp.ddlAeFolder;
        var digicutddl =         panel.grp.MainGrp.stackMethodGrp.DetectMethodGrp.DigicutGrp.ddlDigicut;
        var LayerInddl=    panel.grp.MainGrp.stackMethodGrp.DetectMethodGrp.layerRefGrp.ddlInputLayer;
        var LayerOutddl=    panel.grp.MainGrp.stackMethodGrp.DetectMethodGrp.layerRefGrp.ddlOutputLayer;


        //functions
        panel.grp.MainGrp.BtnGrp.btnRefresh.onClick = function(){
            refreshDdls (folderSourceddl, digicutddl, LayerInddl, LayerOutddl);
            }

        panel.grp. MainGrp.stackMethodGrp.timeMethodGrp.impSettingsMethodGrp.footageGrp.btnSelectTCFolder.onClick = function (){

           var targetFolder = Folder.selectDialog('Select Folder Containing Footage to Conform');
           var filterArray = [".dpx",".tga",".tiff",".exr",".png",".psd",".ai"];
          
           
           targetSequences = listSequencesInFolders(targetFolder ,filterArray);
           return targetSequences;
           }
       
       
        panel.grp.MainGrp.BtnGrp.btnStart.onClick = function(){
            var precompsName = panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.impSettingsMethodGrp.precompGrp.etxName.text;
            if (!(app.project.activeItem instanceof CompItem)){
                alert ("Open a Composition");
                return
                }
            //var from ui
            // class boolsParam && handlesParam
            var   boolsParam = {};
            boolsParam.boolTimeWarp = panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.SettingsGrp.cbTimeWarp.value;
            boolsParam.boolOpacity = panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.SettingsGrp.cbOpacity.value;
            boolsParam.boolFitToComp = panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.SettingsGrp.cbFitToComp.value;
            boolsParam.boolTransform = panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.SettingsGrp.cbTransfrom.value;


             //handles settings
            var handlesParam = {};
            handlesParam.handleIn = parseInt(panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.etxHandleIn.text);
            handlesParam.handleOut = parseInt(panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.etxHandleOut.text);
            handlesParam.handlesFbool = panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.DurationGrp.cbFixedHandles.value;


            var methodmatricule = panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.impSettingsMethodGrp.ddlSelectMethod.selection;
            //folders to stock footages and precomps
            var footageFolder = findFolderWithName ("FOOTAGE_CONFO_TC",true);
            var precompsFolder =findFolderWithName (precompsName,true);
           

            

            app.beginUndoGroup ("Import"); //begin undo Group
            var fxName = "tl_Fast_Sample";
            var method  = checkMethodSync ();
            var  fxCheckB = false;

             // CHECK PLUGIN FAST SAMPLE  
             fxCheckB =checkForInstalledEffect(fxName);

            
             if (method ==3)
            {
                 if  (fxCheckB == false) {alert ("missing FastSample effect"); return}
                //refresh Layer Digicut
                var layerdigicutIndex = parseInt (returnIndexFromddl(digicutddl.selection))+1;
                //Max Value  &&   MAx Around
                var maxDiff = parseFloat (panel.grp.MainGrp.stackMethodGrp.DetectMethodGrp.DetectRefGrp.txlimitDiff.text)/1000;
                var MaxAround = parseInt (panel.grp.MainGrp.stackMethodGrp.DetectMethodGrp.DetectRefGrp.txlimitAnalys.text);
                var timeWarpbool = panel.grp.MainGrp.stackMethodGrp.DetectMethodGrp.DetectRefGrp.cbTwarp.value; 
                //add sampleFx  layer
                var activeComp = app.project.activeItem;
                var sampleFxArray = addSampleFx (activeComp, fxName, layerdigicutIndex);      
                // refresh folder source in AE
                var folderIndex = parseInt (returnIndexFromddl(folderSourceddl.selection));
                var folderItemsList = getFolderListItems (app.project.item(folderIndex));
                // refresh Layer Num Ref Edit, input et output (si output < input alors inverser)
                var layerRefIn= parseInt (LayerInddl.selection) +1;   //increment because we'll add  fx layer
                var layerRefOut=  parseInt (LayerOutddl.selection)+1 ;   //increment because we'll add  fx layer
                
                if (layerRefIn > layerRefOut)
                {
                    var tempon =  layerRefIn;
                    layerRefIn =  layerRefOut; 
                    layerRefOut = tempon;
                    tempon.delete;
                }
               
                applyDetection (layerdigicutIndex, maxDiff,MaxAround,timeWarpbool, activeComp, sampleFxArray, folderIndex,folderItemsList,layerRefIn, layerRefOut);

               
             	activeComp.layer(1).remove()   // delete sampleFxArray
            }
           
            else
            {

 
                conformByTime (method, newLayerName, targetSequences,precompsFolder , precompsName,boolsParam, footageFolder, handlesParam, methodmatricule);
               
            }
             var boolShot = panel.grp.MainGrp.stackMethodGrp.timeMethodGrp.impSettingsMethodGrp.precompGrp.cbWatermark.value;
            if (boolShot == true)
            {

                    var wlayertxt = app.project.activeItem.layers.addText ("watermark");
                    var watermarkTxt = wlayertxt.property("ADBE Text Properties").property("ADBE Text Document");
                    var  textVal = watermarkTxt.value;
                    
                    textVal.fontSize = 20;
                    textVal.font = "Arial";
                    watermarkTxt.setValue (textVal);
                    
                    var txtExpr = "for (var i =1; i <= thisComp.numLayers; i++){if  (thisComp.layer(i).name.indexOf ('"+precompsName+"') !=-1 && thisComp.layer(i).active) {text = thisComp.layer(i).name}}"
                    watermarkTxt.expression = txtExpr;
                    try{
                        
                    wlayertxt.position.setValue( [app.project.activeItem.width/10, app.project.activeItem.height*0.90]);} catch(e){alert(e)}
                    
                    
            }
            
            app.endUndoGroup;
            }
        }
    var panel = buildUI(thisObj);

    if (panel instanceof Window) {
        panel.center();
        panel.show();
    } else {
        panel.layout.layout(true);
    }

    callbackUI(panel);

})(this);
