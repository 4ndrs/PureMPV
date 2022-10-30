'use strict';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _createForOfIteratorHelper(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (!it) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it) o = it;
      var i = 0;
      var F = function () {};
      return {
        s: F,
        n: function () {
          if (i >= o.length) return {
            done: true
          };
          return {
            done: false,
            value: o[i++]
          };
        },
        e: function (e) {
          throw e;
        },
        f: F
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var normalCompletion = true,
    didErr = false,
    err;
  return {
    s: function () {
      it = it.call(o);
    },
    n: function () {
      var step = it.next();
      normalCompletion = step.done;
      return step;
    },
    e: function (e) {
      didErr = true;
      err = e;
    },
    f: function () {
      try {
        if (!normalCompletion && it.return != null) it.return();
      } finally {
        if (didErr) throw err;
      }
    }
  };
}

function copyToSelection(text,selection){if(selection!="primary"&&selection!="clipboard"){print("ERROR: ".concat(selection," is not a valid selection. ")+"Possible values are: primary, clipboard");print("INFO: setting selection to 'primary'");selection="primary";}mp.commandv("run","bash","-c","(echo -n '".concat(text,"'| xclip -selection ").concat(selection,")"));printMessage("Copied to ".concat(selection,": ").concat(text));}function getTimePosition(){var timePos=mp.get_property("time-pos");return new Date(timePos*1000).toISOString().substring(11,23)}function printMessage(message){mp.osd_message(message);print(message);}

function getStreamUrls(path){var source=getSource(path);switch(source){case"youtube":{var streams=mp.get_property("stream-open-filename").split(";");var urls=[];var _iterator=_createForOfIteratorHelper(streams),_step;try{for(_iterator.s();!(_step=_iterator.n()).done;){var stream=_step.value;stream.search("googlevideo")!==-1&&urls.push(stream.match(/http.*/)[0]);}}catch(err){_iterator.e(err);}finally{_iterator.f();}return urls}default:return;}}function getSource(path){var isYoutube=path.search("youtube|youtu.be")!==-1;if(isYoutube){return "youtube"}}

var Encoder=function(){function Encoder(){_classCallCheck(this,Encoder);this.burnSubs=false;}_createClass(Encoder,[{key:"preview",value:function preview(startTime,endTime,cropBox){printMessage("Processing preview");var path=mp.get_property("path");var muteAudio=mp.get_property("mute")==="yes"?"-an":"";var params="".concat(muteAudio," -map_metadata -1 -map_chapters -1 -f matroska ")+"-c:v libx264 -preset ultrafast - | mpv - --loop";var _serialize=serialize(path,startTime,endTime,cropBox,false,true),inputs=_serialize.inputs,cropLavfi=_serialize.cropLavfi;var command="ffmpeg -hide_banner ".concat(inputs.join(" ")," ").concat(cropLavfi," ").concat(params);mp.commandv("run","bash","-c","(".concat(command,")"));}},{key:"encode",value:function encode(startTime,endTime,cropBox,extraParams){var path=mp.get_property("path");var _serialize2=serialize(path,startTime,endTime,cropBox,true,true),inputs=_serialize2.inputs,cropLavfi=_serialize2.cropLavfi;var command=["purewebm"].concat(_toConsumableArray(inputs));cropLavfi&&command.push.apply(command,_toConsumableArray(cropLavfi.split(" ")));this.burnSubs&&command.push.apply(command,["-subs"]);extraParams&&command.push.apply(command,["--extra_params",extraParams]);mp.command_native({name:"subprocess",args:command,detach:true});}}]);return Encoder}();function serialize(path,startTime,endTime,cropBox,pureWebmMode,inputSeeking){var timestamps=serializeTimestamps(startTime,endTime);var inputs=serializeInputs(path,timestamps,pureWebmMode,inputSeeking);var cropLavfi=cropBox?serializeCropBox(cropBox):null;return {inputs:inputs,cropLavfi:cropLavfi}}function generateCommand(inputs,cropBox){var program=arguments.length>2&&arguments[2]!==undefined?arguments[2]:"";var params=arguments.length>3&&arguments[3]!==undefined?arguments[3]:"";program==="purewebm"?params="":program="ffmpeg";var cropLavfi=serializeCropBox(cropBox);return "".concat(program," ").concat(inputs.join(" ")," ").concat(cropLavfi," ").concat(params).trim()}function serializeTimestamps(startTime,endTime){if(startTime&&endTime){return "-ss ".concat(startTime," -to ").concat(endTime)}if(startTime){return "-ss ".concat(startTime)}if(endTime){return "-to ".concat(endTime)}return ""}function serializeInputs(path,timestamps,subProcessMode,inputSeeking){var isStream=path.search("^http[s]?://")!==-1;if(!timestamps&&!isStream){return subProcessMode?["-i","".concat(path)]:["-i \"".concat(path,"\"")]}if(!isStream){return subProcessMode?[].concat(_toConsumableArray(timestamps.split(" ")),["-i","".concat(path)]):inputSeeking?["".concat(timestamps," -i \"").concat(path,"\"")]:["-i \"".concat(path,"\" ").concat(timestamps)]}var urls=getStreamUrls(path);var inputs=[];if(!urls){print("ERROR: Unable to parse the stream urls. Source is unknown");return}var _iterator=_createForOfIteratorHelper(urls),_step;try{for(_iterator.s();!(_step=_iterator.n()).done;){var url=_step.value;if(subProcessMode){inputs.push.apply(inputs,[].concat(_toConsumableArray(timestamps.split(" ")),["-i","".concat(url)]));}else {inputSeeking?inputs.push.apply(inputs,["".concat(timestamps," -i \"").concat(url,"\"")]):inputs.push.apply(inputs,["-i \"".concat(url,"\" ").concat(timestamps)]);}}}catch(err){_iterator.e(err);}finally{_iterator.f();}return inputs}function serializeCropBox(cropBox){if(cropBox.w!==null){return "-lavfi crop=".concat(cropBox.toString())}return ""}

var VideoProperties=function(){function VideoProperties(){_classCallCheck(this,VideoProperties);this.width=null;this.height=null;}_createClass(VideoProperties,[{key:"getProperties",value:function getProperties(){this.width=mp.get_property("width");this.height=mp.get_property("height");}}]);return VideoProperties}();var MouseProperties=function(){function MouseProperties(){_classCallCheck(this,MouseProperties);this.x=null;this.y=null;}_createClass(MouseProperties,[{key:"getProperties",value:function getProperties(){var _mp$get_property_nati=mp.get_property_native("mouse-pos"),x=_mp$get_property_nati.x,y=_mp$get_property_nati.y;var _ref=[x,y];this.x=_ref[0];this.y=_ref[1];}}]);return MouseProperties}();

var PureBox=function(){function PureBox(){_classCallCheck(this,PureBox);this.video=new VideoProperties;this.mouse=new MouseProperties;this.pid=mp.utils.getpid();}_createClass(PureBox,[{key:"getCrop",value:function getCrop(){this.video.getProperties();this.mouse.getProperties();var pureBoxProcess=mp.command_native({name:"subprocess",args:["purebox",this.pid.toString(),this.mouse.x.toString(),this.mouse.y.toString(),this.video.width.toString(),this.video.height.toString()],capture_stdout:true});if(pureBoxProcess.status==0){return pureBoxProcess.stdout.split(", ")}}}]);return PureBox}();

var CropBox=function(){function CropBox(pureBoxEnabled,animationEnabled){_classCallCheck(this,CropBox);this.constX=null;this.constY=null;this.w=null;this.h=null;this.x=null;this.y=null;this.animationEnabled=animationEnabled;pureBoxEnabled?this.pureBox=new PureBox:this.mouse=new MouseProperties;}_createClass(CropBox,[{key:"getCrop",value:function getCrop(){if(this.w!==null){this.resetCrop();return}if(this.pureBox){var _this$pureBox$getCrop=this.pureBox.getCrop();var _this$pureBox$getCrop2=_slicedToArray(_this$pureBox$getCrop,4);this.x=_this$pureBox$getCrop2[0];this.y=_this$pureBox$getCrop2[1];this.w=_this$pureBox$getCrop2[2];this.h=_this$pureBox$getCrop2[3];}else {this.generateCrop();}}},{key:"generateCrop",value:function generateCrop(){if(!this.isCropping){this.isCropping=true;this.setInitialMousePosition();this.animationEnabled&&mp.observe_property("mouse-pos","native",animateBox);printMessage("Cropping started");}else {this.calculateBox();this.drawBox();this.isCropping=false;this.animationEnabled&&mp.unobserve_property(animateBox);printMessage("Cropping ended");}}},{key:"animateCropBox",value:function animateCropBox(){this.calculateBox();this.drawBox();}},{key:"setInitialMousePosition",value:function setInitialMousePosition(){var _ref;this.mouse.getProperties();this.x=this.mouse.x;this.y=this.mouse.y;this.constX=this.mouse.x;this.constY=this.mouse.y;this.animationEnabled&&(_ref=[this.w,this.h,this.x,this.y,this.constX,this.constY],box.w=_ref[0],box.h=_ref[1],box.x=_ref[2],box.y=_ref[3],box.constX=_ref[4],box.constY=_ref[5],_ref);}},{key:"calculateBox",value:function calculateBox(){this.mouse.getProperties();if(this.mouse.x<this.constX){this.x=this.mouse.x;this.mouse.x=this.constX;this.x=Math.min(this.mouse.x,this.x);this.w=this.mouse.x-this.x;}else {this.mouse.x=Math.max(this.mouse.x,this.x);this.x=Math.min(this.mouse.x,this.x);this.w=this.mouse.x-this.x;}if(this.mouse.y<this.constY){this.y=this.mouse.y;this.mouse.y=this.constY;this.y=Math.min(this.mouse.y,this.y);this.h=this.mouse.y-this.y;}else {this.mouse.y=Math.max(this.mouse.y,this.y);this.y=Math.min(this.mouse.y,this.y);this.h=this.mouse.y-this.y;}}},{key:"toString",value:function toString(){return "".concat(this.w,":").concat(this.h,":").concat(this.x,":").concat(this.y)}},{key:"drawBox",value:function drawBox(){var color="deeppink";mp.commandv("vf","add","@box:drawbox=w=".concat(this.w,":h=").concat(this.h,":x=").concat(this.x,":y=").concat(this.y,":color=").concat(color));}},{key:"resetCrop",value:function resetCrop(){this.constX=null;this.constY=null;this.w=null;this.h=null;this.x=null;this.y=null;if(!this.pureBox){mp.commandv("vf","remove","@box");}printMessage("Crop reset");}}]);return CropBox}();var box={w:null,h:null,x:null,y:null};function animateBox(name,mousePos){calculateBox(mousePos);drawBox();}function drawBox(){var color="deeppink";mp.commandv("vf","add","@box:drawbox=w=".concat(box.w,":h=").concat(box.h,":x=").concat(box.x,":y=").concat(box.y,":color=").concat(color));}function calculateBox(mousePos){var x=mousePos.x,y=mousePos.y;if(x<box.constX){box.x=x;x=box.constX;box.x=Math.min(x,box.x);box.w=x-box.x;}else {x=Math.max(x,box.x);box.x=Math.min(x,box.x);box.w=x-box.x;}if(y<box.constY){box.y=y;y=box.constY;box.y=Math.min(y,box.y);box.h=y-box.y;}else {y=Math.max(y,box.y);box.y=Math.min(y,box.y);box.h=y-box.y;}}

var PureMPV=function(){function PureMPV(){_classCallCheck(this,PureMPV);this.setKeybindings();this.loadConfig();this.endTime=null;this.startTime=null;this.encoder=new Encoder;this.cropBox=new CropBox(this.options.pure_box,this.options.cropbox_animation);}_createClass(PureMPV,[{key:"setKeybindings",value:function setKeybindings(){var _this=this;mp.add_key_binding("ctrl+w","get-file-path",function(){return _this.getFilePath()});mp.add_key_binding("ctrl+shift+w","generate-preview",function(){return _this.encode("preview")});mp.add_key_binding("ctrl+e","get-timestamp",function(){return _this.getTimestamp()});mp.add_key_binding("ctrl+shift+e","set-endtime",function(){return _this.getTimestamp("end-time")});mp.add_key_binding("ctrl+c","get-crop",function(){return _this.crop()});mp.add_key_binding("ctrl+p","toggle-puremode",function(){return _this.togglePureMode()});}},{key:"loadConfig",value:function loadConfig(){var _this2=this;this.options={copy_mode:"ffmpeg",pure_mode:true,pure_box:false,pure_webm:false,ffmpeg_params:"",purewebm_extra_params:"",input_seeking:true,selection:"primary",cropbox_animation:false};mp.options.read_options(this.options,"PureMPV");if(!this.options.pure_mode){mp.remove_key_binding("generate-preview");mp.remove_key_binding("set-endtime");}if(this.options.pure_webm){mp.add_key_binding("ctrl+o","purewebm",function(){return _this2.encode("purewebm")});mp.add_key_binding("ctrl+shift+o","purewebm-extra-params",function(){return _this2.encode("purewebm-extra-params")});mp.add_key_binding("ctrl+v","toggle-burn-subs",function(){_this2.encoder.burnSubs=!_this2.encoder.burnSubs;printMessage("Burn subtitles: ".concat(_this2.encoder.burnSubs?"yes":"no"));});}}},{key:"crop",value:function crop(){this.cropBox.getCrop();if(!this.options.pure_mode&&!this.cropBox.isCropping){copyToSelection(this.cropBox.toString(),this.options.selection);}}},{key:"encode",value:function encode(mode){var _this$encoder,_this$encoder2,_this$encoder3;var args=[this.startTime,this.endTime,this.cropBox];switch(mode){case"preview":(_this$encoder=this.encoder).preview.apply(_this$encoder,args);return;case"purewebm":(_this$encoder2=this.encoder).encode.apply(_this$encoder2,args);return;case"purewebm-extra-params":(_this$encoder3=this.encoder).encode.apply(_this$encoder3,args.concat([this.options.purewebm_extra_params]));return;}}},{key:"getFilePath",value:function getFilePath(){var path=mp.get_property("path");if(!this.options.pure_mode){copyToSelection(path,this.options.selection);return}var _serialize=serialize(path,this.startTime,this.endTime,null,false,this.options.input_seeking),inputs=_serialize.inputs;var command=generateCommand(inputs,this.cropBox,this.options.copy_mode,this.options.ffmpeg_params);copyToSelection(command,this.options.selection);}},{key:"getTimestamp",value:function getTimestamp(getEndTime){var timestamp=getTimePosition();if(getEndTime&&this.options.pure_mode){this.endTime=timestamp;printMessage("Set end time: ".concat(this.endTime));return}if(!this.options.pure_mode){copyToSelection(timestamp,this.options.selection);}else if(!this.startTime){this.startTime=timestamp;printMessage("Set start time: ".concat(this.startTime));}else if(!this.endTime){this.endTime=timestamp;printMessage("Set end time: ".concat(this.endTime));}else {var _ref=[null,null];this.startTime=_ref[0];this.endTime=_ref[1];printMessage("Times reset");}}},{key:"togglePureMode",value:function togglePureMode(){var _this3=this;this.options.pure_mode=!this.options.pure_mode;var status="Pure Mode: ";if(this.options.pure_mode){status+="ON";mp.add_key_binding("ctrl+shift+w","generate-preview",function(){return _this3.encode("preview")});mp.add_key_binding("ctrl+shift+e","set-endtime",function(){return _this3.getTimestamp("end-time")});}else {status+="OFF";mp.remove_key_binding("generate-preview");mp.remove_key_binding("set-endtime");}printMessage(status);}}]);return PureMPV}();new PureMPV;
