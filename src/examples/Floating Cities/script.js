import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from "https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/TransformControls.js";
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/3DMLoader.js'
import rhino3dm from 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/rhino3dm.module.js'






// set up loader for converting the results to threejs
const loader = new Rhino3dmLoader()
loader.setLibraryPath( 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/' )


const definition = "Floating Cities.gh";
// initialise 'data' object that will be used by compute()

const IncreaseAttraction_slider = document.getElementById("IncreaseAttraction");
IncreaseAttraction_slider.addEventListener("mouseup", onSliderChange, false);
IncreaseAttraction_slider.addEventListener("touchend", onSliderChange, false);
const StairDensity_slider = document.getElementById("StairDensity");
StairDensity_slider.addEventListener("mouseup", onSliderChange, false);
StairDensity_slider.addEventListener("touchend", onSliderChange, false);
const AddTrees_slider = document.getElementById("AddTrees");
AddTrees_slider.addEventListener("mouseup", onSliderChange, false);
AddTrees_slider.addEventListener("touchend", onSliderChange, false);
const WindowCoefficient_slider = document.getElementById("WindowCoefficient");
WindowCoefficient_slider.addEventListener("mouseup", onSliderChange, false);
WindowCoefficient_slider.addEventListener("touchend", onSliderChange, false);
const WindowWidthRatio_slider = document.getElementById("WindowWidthRatio");
WindowWidthRatio_slider.addEventListener("mouseup", onSliderChange, false);
WindowWidthRatio_slider.addEventListener("touchend", onSliderChange, false);
const WindowHeightRatio_slider = document.getElementById("WindowHeightRatio");
WindowHeightRatio_slider.addEventListener("mouseup", onSliderChange, false);
WindowHeightRatio_slider.addEventListener("touchend", onSliderChange, false);

let points = [];

// globals
let rhino, doc

rhino3dm().then(async (m) => {
  console.log("Loaded rhino3dm.");
  rhino = m; // global

  init();
  rndPts();
  compute();
});

function rndPts() {
  // generate random points

  const cntPts = 4;
  const bndX = 12;
  

  for (let i = 0; i < cntPts; i++) {
    const x = Math.random() *  bndX;
    const y = Math.random() *  bndX;
    const z = Math.random() *  bndX;

    const pt = '{"X":' + x + ',"Y":' + y + ',"Z":' + z + "}";

    console.log(`x ${x} y ${y} z ${z}`);

    points.push(pt);

    //viz in three
    const icoGeo = new THREE.IcosahedronGeometry(0.1);
    const icoMat = new THREE.MeshNormalMaterial();
    const ico = new THREE.Mesh(icoGeo, icoMat);
    ico.name = "ico";
    ico.position.set(x, y, z);
    sceneR.add(ico);
    let tcontrols = new TransformControls(camera, renderer.domElement);
    tcontrols.enabled = true;
    tcontrols.attach(ico);
    //tcontrols.showZ = false;
    tcontrols.addEventListener("dragging-changed", onChange);
    sceneL.add(tcontrols);
    sceneR.add(tcontrols);
  }
}

let dragging = false;
function onChange() {
  dragging = !dragging;
  if (!dragging) {
    // update points position
    points = [];
    sceneR.traverse((child) => {
      if (child.name === "ico") {
        const pt =
          '{"X":' +
          child.position.x +
          ',"Y":' +
          child.position.y +
          ',"Z":' +
          child.position.z +
          "}";
        points.push(pt);
        console.log(pt);
      }
    }, false);

    sceneL.traverse((child) => {
      if (child.name === "ico") {
        const pt =
          '{"X":' +
          child.position.x +
          ',"Y":' +
          child.position.y +
          ',"Z":' +
          child.position.z +
          "}";
        points.push(pt);
        console.log(pt);
      }
    }, false);

    compute();

    controls.enabled = true;
    return;
  }

  controls.enabled = false;
}

// more globals
let  camera, renderer, controls, cubeMap
let sceneL, sceneR;
let sliderPos = window.innerWidth / 2;


/**
 * Sets up the scene, camera, renderer, lights and controls and starts the animation
 */
function init() {

    // Rhino models are z-up, so set this as the default
    THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 );
   
    // create a scene and a camera
    sceneL = new THREE.Scene()


    cubeMap = new THREE.CubeTextureLoader()
        .setPath('texture/')
        .load( [ 'px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg' ] )
    
    sceneL.background = cubeMap;

    sceneR = new THREE.Scene()
    sceneR.background = new THREE.Color('whitesmoke')

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.set(-35,-35, 70) // like perspective view
    camera.lookAt(5,5,-70)
    
    // very light grey for background, like rhino
    //scene.background = new THREE.Color('whitesmoke')


    initSlider();
    // create the renderer and add it to the html
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setScissorTest( true );
    renderer.setAnimationLoop( render );
    document.getElementById('canvas').appendChild(renderer.domElement)

    // add some controls to orbit the camera
    controls = new OrbitControls(camera, renderer.domElement)

    

    // add a directional light
    const directionalLight = new THREE.DirectionalLight( 0xffffff )
    directionalLight.intensity = 2
    sceneL.add( directionalLight.clone() )
    sceneR.add( directionalLight.clone() )
    const ambientLight = new THREE.AmbientLight()
    sceneL.add( ambientLight.clone() )
    sceneR.add( ambientLight.clone() )
    // handle changes in the window size
    window.addEventListener( 'resize', onWindowResize, false )

    

    //animate()
}



/**
 * Call appserver
 */
async function compute() {

  showSpinner(true);

  const data = {
    definition: definition,
    inputs: {
      points: points,
      IncreaseAttraction: IncreaseAttraction_slider.valueAsNumber,
      StairDensity: StairDensity_slider.valueAsNumber,
      AddTrees: AddTrees_slider.valueAsNumber,
      WindowCoefficient: WindowCoefficient_slider.valueAsNumber,
      WindowWidthRatio: WindowWidthRatio_slider.valueAsNumber,
      WindowHeightRatio: WindowHeightRatio_slider.valueAsNumber,
      
    },
  };

  console.log(data.inputs);

  // construct url for GET /solve/definition.gh?name=value(&...)
  const request = {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  };

  try {
    const response = await fetch("/solve", request);

    if (!response.ok) throw new Error(response.statusText);

    const responseJson = await response.json();
    collectResults(responseJson);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Parse response
 */
 function collectResults(responseJson) {
  const values = responseJson.values;

  console.log(values);

  // clear doc
  try {
    if (doc !== undefined) doc.delete();
  } catch {}

  //console.log(values)
  doc = new rhino.File3dm();

  // for each output (RH_OUT:*)...
  for (let i = 0; i < values.length; i++) {
    // ...iterate through data tree structure...
    for (const path in values[i].InnerTree) {
      const branch = values[i].InnerTree[path];
      // ...and for each branch...
      for (let j = 0; j < branch.length; j++) {
        // ...load rhino geometry into doc
        const rhinoObject = decodeItem(branch[j]);
        if (rhinoObject !== null) {
          // console.log(rhinoObject)
          doc.objects().add(rhinoObject, null);
        }
      }
    }
  }

  if (doc.objects().count < 1) {
    console.error("No rhino objects to load!");
    showSpinner(false);
    return;
  }

    // load rhino doc into three.js scene
    
    const buffer = new Uint8Array(doc.toByteArray()).buffer;
  loader.parse(buffer, function (object) {
    
        // debug 
        
        object.traverse(child => {
          if (child.material !== undefined)
            child.material = new THREE.MeshNormalMaterial()
        }, false)
        

        // clear objects from scene. do this here to avoid blink
        sceneL.traverse((child) => {
          if (
            child.userData.hasOwnProperty("objectType") &&
            child.userData.objectType === "File3dm"
          ) {
            sceneL.remove(child);
          }
        });

        sceneR.traverse((child) => {
          if (
            child.userData.hasOwnProperty("objectType") &&
            child.userData.objectType === "File3dm"
          ) {
            sceneR.remove(child);
          }
        });
        // add object graph from rhino model to three.js scene
        sceneL.add( object.clone() )
        sceneR.add( object.clone() )
        // hide spinner and enable download button
        showSpinner(false)
        //downloadButton.disabled = false

        // zoom to extents
        //zoomCameraToSelection(camera, controls, scene.children)
    })
}

/**
 * Attempt to decode data tree item to rhino geometry
 */
 function decodeItem(item) {
  const data = JSON.parse(item.data);
  if (item.type === "System.String") {
    // hack for draco meshes
    try {
      return rhino.DracoCompression.decompressBase64String(data);
    } catch {} // ignore errors (maybe the string was just a string...)
  } else if (typeof data === "object") {
    return rhino.CommonObject.decode(data);
  }
  return null;
}

/**
 * Called when a slider value changes in the UI. Collect all of the
 * slider values and call compute to solve for a new scene
 */
function onSliderChange () {
  showSpinner(true)
  compute()
}

function showSpinner(enable) {
  if (enable) document.getElementById("loader").style.display = "block";
  else document.getElementById("loader").style.display = "none";
}

/**
 * The animation loop!
 */
function animate() {
  requestAnimationFrame( animate )
  controls.update()
  renderer.render(scene, camera)


}


function initSlider() {

  const slider = document.querySelector( '.slider' );

  function onPointerDown() {

    if ( event.isPrimary === false ) return;

    controls.enabled = false;

    window.addEventListener( 'pointermove', onPointerMove );
    window.addEventListener( 'pointerup', onPointerUp );

  }

  function onPointerUp() {

    controls.enabled = true;

    window.removeEventListener( 'pointermove', onPointerMove );
    window.removeEventListener( 'pointerup', onPointerUp );

  }

  function onPointerMove( e ) {

    if ( event.isPrimary === false ) return;

    sliderPos = Math.max( 0, Math.min( window.innerWidth, e.pageX ) );

    slider.style.left = sliderPos - ( slider.offsetWidth / 2 ) + "px";

  }

  slider.style.touchAction = 'none'; // disable touch scroll
  slider.addEventListener( 'pointerdown', onPointerDown );

}

/**
 * Helper function for window resizes (resets the camera pov and renderer size)
  */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )
  //animate()
}

function render() {

  renderer.setScissor( 0, 0, sliderPos, window.innerHeight );
  renderer.render( sceneL, camera );

  renderer.setScissor( sliderPos, 0, window.innerWidth, window.innerHeight );
  renderer.render( sceneR, camera );

}

/**
 * Helper function that behaves like rhino's "zoom to selection", but for three.js!
 */
function zoomCameraToSelection( camera, controls, selection, fitOffset = 1.2 ) {
  
  const box = new THREE.Box3();
  
  for( const object of selection ) {
    if (object.isLight) continue
    box.expandByObject( object );
  }
  
  const size = box.getSize( new THREE.Vector3() );
  const center = box.getCenter( new THREE.Vector3() );
  
  const maxSize = Math.max( size.x, size.y, size.z );
  const fitHeightDistance = maxSize / ( 2 * Math.atan( Math.PI * camera.fov / 360 ) );
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = fitOffset * Math.max( fitHeightDistance, fitWidthDistance );
  
  const direction = controls.target.clone()
    .sub( camera.position )
    .normalize()
    .multiplyScalar( distance );
  controls.maxDistance = distance * 10;
  controls.target.copy( center );
  
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  camera.position.copy( controls.target ).sub(direction);
  
  controls.update();
  
}

/**
 * This function is called when the download button is clicked
 */
function download () {
    // write rhino doc to "blob"
    const bytes = doc.toByteArray()
    const blob = new Blob([bytes], {type: "application/octect-stream"})

    // use "hidden link" trick to get the browser to download the blob
    const filename = data.definition.replace(/\.gh$/, '') + '.3dm'
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = filename
    link.click()
}

