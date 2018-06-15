var comp = app.project.activeItem;
var refLayerIndex = 1;   //reference or digicut layer
var targetLayerIndex =2; // targetLayerIndex;
var fps = 25;
var tolerance = 0.0040;



  	/**
    * check plugin install
    * @
    */
    function checkForInstalledEffect(fxName){

        var effects = app.effects;

        for (var i = 0; i < effects.length; i++){
        if (effects[i].displayName ===  fxName.toString()){
            return true;
            }
        }
        return false;
    }

    /**
    . create layer for fx
    */
    function addSampleFx (activeComp, layerRefIndex, layerTargetIndex){
        //create and param  Solid FX
         var fxName = "tl_Fast_Sample";
        var SolidEffect =activeComp.layers.addSolid( [1,1,1], "SampleFx", activeComp.width, activeComp.height,activeComp.pixelAspect, activeComp.duration);
        var sampleFx = SolidEffect.Effects.addProperty (fxName);

        // Param layer 1
        sampleFx.property(2).setValue (layerTargetIndex);
         // Param layer 2
        sampleFx.property(3).setValue (layerRefIndex);
        //comparatif = substract
        sampleFx.property(4).setValue(3);
        
        //return ParamLayer2 selection
        var paramLayerTwoAdress = sampleFx.property(3);
        //return ParamLayer1 TimeOffset & tranform properties adress
       
        var layerOneProp = [sampleFx.property(7), sampleFx.property(8), sampleFx.property(9), sampleFx.property(10) ] //timeoffset transform , scale  and opacity adresses
        //return ParamLayer2 TimeOffset & tranform properties adress
        var layerTwoProp = [sampleFx.property(13), sampleFx.property(14),sampleFx.property(15), sampleFx.property(16)] ; //timeoffset transform scale  and opacity adresses

        
        //return lumaResultAdress
        var lumaAdress = sampleFx.property(20);
        //return R/G/B access
        var colorsAdress = {}
         colorsAdress.red = sampleFx.property(19);
         colorsAdress.green = sampleFx.property(20);
         colorsAdress.blue = sampleFx.property(23);
        //return  link to the checkbox
        var cbRefreshAdress =  sampleFx.property(24);
        return [sampleFx, paramLayerTwoAdress,layerOneProp, layerTwoProp,lumaAdress, colorsAdress, cbRefreshAdress]
        }


  
  	/**
    * analyse pixel value (return true if black)
    * @
    */
     function callAnalys (sampleFxArray, timeT){
        //assuming that the fxSample is the first layer and sample FX as 1st effect
        sampleFxArray[6].setValue (1);
        var memoryWait =0;
            
        while (sampleFxArray[6].value == 1){
            memoryWait ++;
            if (sampleFxArray[6].value == 0){
                break;
                }
            }
        var rgbAdress =sampleFxArray[5];
        var rgb =0;
        //var rgb = rgbAdress.red.valueAtTime(timeT, false) +rgbAdress.green.valueAtTime(timeT, false) +rgbAdress.blue.valueAtTime(timeT, false);
        //alert (rgb);
        var luma =sampleFxArray[4].valueAtTime(timeT, false);
        return [rgb, luma]
        }
    function GetErrors (comp, sampleFxArray,tolerance) {
	    	var listError = [];
	    	var numFrames = comp.duration*fps;
	    	   var tempWindow = new Window('palette');
			    tempWindow.info = tempWindow.add("staticText",[0,0,200,50], "Analysing");
			    tempWindow.progressScan = tempWindow.add("progressBar", undefined, 0, numFrames);
			    tempWindow.progressScan.preferredSize.width = 300;
			    tempWindow.show();
	    	for (var i =0; i < numFrames; i++){

	    		tempWindow .progressScan.value = i*100/numFrames;
	    		result = callAnalys (sampleFxArray, parseFloat (i/fps));
	    		if (result[1]> tolerance){

	    			var error = {};
	    			error.val = result[1];
	    			error.timeS =parseFloat (i/fps);
	    			error.timeF = i;
	    			listError.push (error);
	    		}
	    	}
	    	return listError 
	    	}

      /**
    * add marker @time 
    * @
    */
    function createMarkers (comp,errorList){
    	try {
	    	for (var i=0; i<errorList.length; i++){
	    		var txtCmt = " diff value = " + errorList[i].val; 
	    		var errorComment = new MarkerValue(txtCmt);
	    		comp.layer(1).property("Marker").setValueAtTime(errorList[i].timeS, errorComment);
	    		}
	    	}
    	catch (e) {alert (e)}
    	}



    /**
    * Manage callback for UI panel
    * @params {Window|Panel} panel
    */

    if (comp){
    	app.beginUndoGroup ("checkout")
    	 refLayerIndex +=1;
    	 targetLayerIndex +=1;
    	 var plugin = checkForInstalledEffect ("tl_Fast_Sample");
    	 if (plugin == true) {
    	 	
    		var sampleFxArray = addSampleFx (comp, refLayerIndex, targetLayerIndex);
    		var errorList =GetErrors ( comp, sampleFxArray,tolerance);
    		createMarkers (comp, errorList);
    	}
    	app.endUndoGroup ();
    }


