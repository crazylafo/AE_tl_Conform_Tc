/**
 * @fileoverview
 *
 * @author Thomas Larforge
 * @Sync Footage by using TimeCode
 * License GPL V3
 * @version 1.12  --> Clean CallBack et rorganise functions and compatible windows correct the copy functiions with multiples properties.
 * @version 1.13->debug timeremap of a layer
 *  TO DO LIST  1.14: 
 *sort files with same names but differient extensions in same folder
 *
 */

#strict on
#target aftereffects



(function (thisObj) {
    var version =  "0.1.13";
    var os = $.os:
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
                stxDescription: StaticText {text: "CONFORM FROM TC\\nCopyright © 2017 Thomas Laforge", alignment: ['fill','top'], properties: {multiline:true}}
                }
                MainGrp: Group {
                orientation : 'column',
                alignement : ['fill', 'fill'],
                alignChildren:['left','top'],
                impSettingsMethodGrp : Panel {
                     text: 'Import Settings',
                     orientation: 'column',
                     alignChildren: ['fill', 'fill'],
                     ddlSelectMethod: DropDownList { properties: {items : [' IMPORT FOOTAGE WITHOUT PRECOMPOSING', ' WATCH IN EXISTING PRECOMPS ONLY', 'IMPORT FOOTAGE AND PRECOMPOSE']}},
                     precompGrp : Group{
                        orientation: 'row',
                        alignChildren: ['fill', 'center'],
                        stxRef : StaticText  {text: "Precomps Name"},
                        etxName : EditText  {text : "SHOT"},
                        }
                    footageGrp: Group{
                        orientation: 'row',
                        btnSelectTCFolder : Button {text : 'Select Folder to Import'},
                        cbCheckProjectItems : Checkbox {text : 'Check items in Projet before Importing (slower)'},
                        }  
                    }
                    MethodeGrp : Panel {
                    text: 'Confomation Settings',
                    orientation: 'row',
                        rbOnlyTc : RadioButton {text : 'Use only TimeCode to sync'},
                        rbreelNameAndTimeCode : RadioButton {text : 'Use Time Code  and Reel Names to sync'},
                    }
                    SettingsGrp : Panel {
                    text: 'Automate Settings',
                    orientation: 'row',
                        cbTimeWarp : Checkbox {text : 'Time Remaping'},
                        cbFitToComp : Checkbox {text : 'Fit To Comp'},
                        cbTransfrom : Checkbox {text : 'Transform Effects'},
                        cbOpacity : Checkbox {text : 'Opacity Effects'}, 
                    }
                   
                BtnGrp : Group {
                alignement : ['fill', 'fill'],
                orientation: 'row',
                btnStart : Button {text : 'Conform'},
                },
              }
        }""";

          
        pal.grp = pal.add(res);

        pal.onResizing = pal.onResize = function() {this.layout.resize();}
        pal.onShow = function() {pal.minimumSize = pal.size; }

        return pal;
    }



    /**
    * @param {String} scanned file
    * @returns  Array {String (parentFolder); String (reelName); Integer(Time Code)
    */
    function splitFileName(scannedFile){
        if (scannedFile != null) {
            var dot = scannedFile.fsName.lastIndexOf(".");
            if (os.indexOf ("Windows") !=-1){
                var delimitationStr = "\\";
                var slash = scannedFile.fsName.lastIndexOf (delimitationStr);
                }
            else {
                var slash =  scannedFile.fsName.lastIndexOf("/");
                }
            var fileExt =  scannedFile.fsName.substr( dot, scannedFile.fsName.length);
            var scannedFileWithoutExt = scannedFile.fsName.substr (0, dot);
            var parentFileFolder = scannedFileWithoutExt.substr (0, slash);
            var reelNameAndTimeCode = scannedFileWithoutExt.substr (slash+1,  scannedFileWithoutExt.toString().length);
            var reelName = "";
            var timeCode = 0;
            var splitArray = [];
                     
            // on part du principe que la suite se termine par n nombre sans points séparateurs entre les chiffres. ex toto_5544223.dpx sera ok/ toto_51.554.42.23 poura etre faussé
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
     * @returns  Array{ numSeuqences, Class { {Sequence matricule,  reelName, tc in, tc out, location pah, fileExtention, firstfileofthelist })
     */
    function listSequencesInFolders(folder,filters) {
        //list Files in targget folder and organise it
        var listFiles =  folder.scanFilesWithProgressBar(filters);
        listFiles.sort(); // organize list items in alphabetical order
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
                sequencesListArray.push (sequence);

                if (i <( listFiles.length-3)) {
                    memoryTcIn = nextTimeCode;
                    memoryFirstFile = listFiles[i+1];
                    sequenceNumber  +=1;
                    }
                }
            }
              
        sequencesListArray.unshift(sequenceNumber);
        alert (sequenceNumber +" sequences found");
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
    * @param {String} inputReelName,  {String} originalFootageName,  {int} inputTcIn,  {int} originalTcIn,  {int}  inputTcOut, {int}  originalTcOut, {bool}  boolReelNameMethod,  {bool} boolOriginalTimeRemap
    * @returns   bool
    */
 
    function checkMergedFootages (inputReelName, originalFootageName, inputTcIn, originalTcIn, inputTcOut,  originalTcOut, originalDuration, boolReelNameMethod, boolOriginalHasTimeRemap) {
        var boolNameMerge = true; // default don 't check reelname, so asume it's true
        var boolReturn = false;
        if (boolReelNameMethod ==true) {
            if ( originalFootageName.indexOf(inputReelName) !=-1){
                 boolNameMerge = true;
                }
            else {
                boolNameMerge = false;
                }
            }
        if (boolNameMerge== true ){

            
           	if ((parseInt (originalTcIn) >= parseInt (inputTcIn) ) &&   //firtst compare with [tcIn and tcIn + duration.]
                (parseInt (originalTcIn + (originalDuration*25)) <= parseInt (inputTcOut))) {
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
        this.originalInPoint = layer.inPoint;
        this.originalOutPoint =layer.outPoint;
        this.originalStartTime = layer.startTime;
          
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
            for (a=1; a<= layer.position.numKeys; a++) {
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
            for (a=1; a<= layer.scale.numKeys; a++) {
                var scaleKeys = {};
                scaleKeys.x = layer.scale.keyValue(a)[0];
                scaleKeys.y = layer.scale.keyValue(a)[1];
                scaleKeys.z = layer.scale.keyValue(a)[2];
                scaleKeys.timeKey = layer.scale.keyTime(a);
                this.scaleKeyArray.push (scaleKeys);
                }
            }
        //opacity
        this.opacityKeyArray= [layer.opacity.numKeys];
        if (layer.opacity.numKeys ==0){
            this.opacityKeyArray.push (layer.opacity.value);
            }
        else {
            for (a=1; a<= layer.opacity.numKeys; a++) {
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
    function copyLayerProperties(referenceLayer, referenceLayerTcIn, referenceLayerStartingTc, referenceLayerDuration, newLayer, newLayerTcIn,boolCopyTimeReamap, boolOpacity, boolFitToComp, boolTransformEffect) {
            var originalParams = new getLayerProperties (referenceLayer);  //get Array of in and out point of the original footage

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
            try {
                newLayer.startTime =originalParams.originalInPoint - ((referenceLayerTcIn - newLayerTcIn)/25);
                newLayer.inPoint =inPoint;  // apply inpoint to the layer
                newLayer.outPoint = outPoint.toFixed(2) ; // apply outpoint to the layer
                }catch (e) {alert (e)}
            /*
            newLayer.inPoint =inPoint - originalParams.originalInPoint;  // apply inpoint to the layer
            newLayer.startTime =originalParams.originalInPoint;  // apply startTime to the layer       
            newLayer.outPoint = outPoint.toFixed(2) ; // apply oupoint to the layer
            $.write(inPoint+"____"+originalParams.originalInPoint+"///"); */
            

            if (boolTimeInverse) { // if time Reverse enable on original then apply it
                newLayer.selected = true;
                app.executeCommand (app.findMenuCommandId ("Time-Reverse Layer"));
                newLayer.selected = false;
                }
            
            // apply timeremap effects if dropbox selected and original footage has timeremap
            if ( ( boolCopyTimeReamap) && (originalParams.timeremapEnabled == true ) ) {   
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
            if (boolOpacity) {
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
            if(boolFitToComp) {
                newLayer.selected = true;
                app.executeCommand (app.findMenuCommandId ("Fit to Comp Width"));
                newLayer.selected = false;
                }
            
            // apply transform  effects if dropbox selected
            if (boolTransformEffect) {

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
        var precompItem = app.project.findCompWithName (currentPrecompName) //identfy the precomp item in the root folder
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
    * precomposeNewLayer    (and update the precompList )
    * @param  {item} refrenceLayer
    * @returns {file}   source of the layer (sometime get error with some files and paths )
    */
    function getCleanLayerSourceFile (layer) {
        try {
            if (layer.source.file) {
                sourceFile = layer.source.file.fsName;
                }
            }
        catch (e) {
            sourceFile = layer.name;
            }
        }
     
    /**
    * Manage callback for UI panel
    * @param {Window|Panel} panel
    */
    function callbackUI(panel) {
        //default
        panel.grp.MainGrp.impSettingsMethodGrp.ddlSelectMethod.selection = 2;
        panel.grp. MainGrp.MethodeGrp.rbOnlyTc.value = 1;   
        panel.grp. MainGrp.impSettingsMethodGrp.footageGrp.cbCheckProjectItems.value =1;
        
        var cbFootageInProject =  panel.grp. MainGrp.impSettingsMethodGrp.footageGrp.cbCheckProjectItems;
        var precompsName = panel.grp. MainGrp.impSettingsMethodGrp.precompGrp.etxName.text ;
        var newLayerName = "_CONFO_TC";
        //functions
        function  checkMethodSync (){
            switch (true) {
                case panel.grp. MainGrp.MethodeGrp.rbOnlyTc.value :
                    return false;
                    break;
                case panel.grp. MainGrp.MethodeGrp.rbreelNameAndTimeCode.value :
                    return true;
                   break;
                default :
                    return false;
                }
            }
        panel.grp. MainGrp.impSettingsMethodGrp.footageGrp.btnSelectTCFolder.onClick = function (){
           var targetFolder = Folder.selectDialog('Select Folder Containing Footage to Conform');
           var filterList = "(\.dpx|\.tga|\.tiff|\.exr|\.png|\.psd)";
           targetSequences = listSequencesInFolders(targetFolder ,filterList);
           return targetSequences;
           }
       
       
        panel.grp.MainGrp.BtnGrp.btnStart.onClick = function(){
            if (!(app.project.activeItem instanceof CompItem)){
                alert ("Open a Composition");
                }
            else {
                //var from ui
                var boolTimeWarp = panel.grp.MainGrp.SettingsGrp.cbTimeWarp.value;
                var boolOpacity = panel.grp.MainGrp.SettingsGrp.cbOpacity.value;
                var boolFitToComp = panel.grp.MainGrp.SettingsGrp.cbFitToComp.value;
                var boolTransform = panel.grp.MainGrp.SettingsGrp.cbTransfrom.value; 
                // var for the ending result
                var numItemsImported =0;
                var numImportedPrecomps =0;
                var numGeneratedPrecomps =0;
                //folders to stock footages and precomps
                var footageFolder = app.project.findFolderWithName ("FOOTAGE_CONFO_TC",true);
                var precompsFolder =app.project.findFolderWithName (precompsName,true);
                
                app.beginUndoGroup ("Import"); //begin undo Group
                
                if (panel.grp.MainGrp.impSettingsMethodGrp.ddlSelectMethod.selection !=0) {     //list precomp if precomp method by precomp on generate precomps is On.
                    var compsArray = getPrecompsList (precompsName);
                    }
                if (panel.grp.MainGrp.impSettingsMethodGrp.ddlSelectMethod.selection !=1) {
                    var  footageInProject = [];
                    if (cbFootageInProject.value ==1) {
                        footageInProject =searchFootageFilesInProject();
                        }
                    }
                for (var i =app.project.activeItem.numLayers ; i >0 ; i --) { //STARTING SCAN OF EACH COMP ITEMS  
                    var currentLayerFrameRate = app.project.activeItem.layer(i).source.frameRate;
                     if ((app.project.activeItem.layer(i).name.indexOf (newLayerName.toString() ) == -1)&&
                         (app.project.activeItem.layer(i).name.indexOf (precompsName)==-1)&& 
                         (app.project.activeItem.layer(i).name.indexOf (" Solid ") ==-1)){    // if layer is not a already conformed item and not a solid 
                         var footageInCompTC = getLayerTimeCodes ( app.project.activeItem.layer(i));
                         var foundInPrecompList =0;
                         if (panel.grp.MainGrp.impSettingsMethodGrp.ddlSelectMethod.selection != 0){     // Precomps method if activated
                             //search if the footage is present in the existing precomps
                             for (var j=1; j < compsArray.length;j++){
                                 var footageInCompOut = footageInCompTC[0] + (footageInCompTC[2]*currentLayerFrameRate ); // force the outpoint because of timeremap values conflict
                                 if (( compsArray[j].tcIn <= footageInCompTC[0] )&& (compsArray[j].tcOut >= footageInCompOut ) ){
                                    var precompAlreadyImported =false;
                                    for (var k=0; k<compsArray[j].layersArray.length; k++) {
                                        var targetInPoint = parseFloat (compsArray[j].layersArray[k]);
                                        if (targetInPoint.toFixed(2)  == app.project.activeItem.layer(i).inPoint.toFixed(2) ) {
                                            precompAlreadyImported = true;
                                            foundInPrecompList = 1;
                                            break;
                                            }
                                        }
                                    if ( foundInPrecompList == 1){
                                        break
                                        }
                                    if (precompAlreadyImported == false ){
                                        var newFootage= app.project.getItemById (compsArray[j].id);
                                         if (newFootage){ 
                                            var newLayer =app.project.activeItem.layers.add(newFootage);
                                            newLayer.label = 11;
                                            i+=1;   //new layer added on the top of the composition so increment i
                                            try {
                                                copyLayerProperties(app.project.activeItem.layer(i), footageInCompTC [0], footageInCompTC[3],footageInCompTC[2], newLayer, compsArray[j].tcIn, boolTimeWarp, boolOpacity, boolFitToComp, boolTransform); 
                                                foundInPrecompList =1;
                                                numImportedPrecomps +=1;
                                                }
                                            catch (e) {
                                                continue
                                                }
                                            newLayer.selected = false;
                                            }
                                        }
                                    }
                                 }
                             }

                         if ((foundInPrecompList ==0)&&   // Footage Method if activated and not found in precomps List
                            (targetSequences !=null)&&
                            (panel.grp.MainGrp.impSettingsMethodGrp.ddlSelectMethod.selection !=1) ){

                            var boolTimeRemap = false;
                            if (app.project.activeItem.layer(i).timeRemapEnabled) {
                                    boolTimeRemap =true;
                                    }   
                            var sourceFile = getCleanLayerSourceFile (app.project.activeItem.layer(i));    
                            for (var j =1; j < targetSequences.length; j++) {
                                var compareFootage = checkMergedFootages (targetSequences[j].reelName, sourceFile, targetSequences[j].tcIn, footageInCompTC[0], targetSequences[j].tcOut, footageInCompTC[1], footageInCompTC[2], checkMethodSync (), boolTimeRemap);
                                                                                                                                                                      
                                if ( compareFootage === true) { 
                                    var importExternalFootage = importSequenceFiles (targetSequences[j].firstFile,targetSequences[j].reelName,footageInProject ); //check if the file already in project 's footage  
                                    var newLayer = app.project.activeItem.layers.add (importExternalFootage);  //input item in the composition
                                    
                                    importExternalFootage.parentFolder =footageFolder ;
                                    newLayer.name = newLayer.name + newLayerName.toString();
                                    numItemsImported +=1; //increment var number of imported items
                                    i+=1;   //new layer added on the top of the composition so increment i
                                    if (panel.grp.MainGrp.impSettingsMethodGrp.ddlSelectMethod.selection !=0) {
                                        
                                        var newPrecomp =    precomposeNewLayer (compsArray,app.project.activeItem.layer(i), precompsName,precompsFolder) ;
                                        newLayer.name =  newPrecomp[0].name;
                                        numGeneratedPrecomps +=1;
                                        compsArray.splice (0, 1, newPrecomp[1]);
                                        compsArray.push (newPrecomp[0]);
                                        }
                                    newLayer.label = 11;
                                    copyLayerProperties(app.project.activeItem.layer(i), footageInCompTC[0], footageInCompTC[3], footageInCompTC[2],newLayer, targetSequences[j].tcIn, boolTimeWarp,boolOpacity, boolFitToComp,boolTransform)
                                    }
                                } 
                            }
                         }
                    }
                app.endUndoGroup;
                alert (numItemsImported + " files imported, "+numGeneratedPrecomps + " generated precomps, "+  numImportedPrecomps + " imported precomps" );
                }
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
