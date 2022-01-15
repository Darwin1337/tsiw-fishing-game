import * as THREE from './three.module.js';
import { OrbitControls } from "https://cdn.skypack.dev/pin/three@v0.136.0-4Px7Kx1INqCFBN0tXUQc/mode=imports,min/unoptimized/examples/jsm/controls/OrbitControls.js";
import { Sky } from "https://cdn.skypack.dev/pin/three@v0.136.0-4Px7Kx1INqCFBN0tXUQc/mode=imports,min/unoptimized/examples/jsm/objects/Sky.js";

// Geral
let camera, scene, renderer, controls;

// Sol e céu
let sol, ceu;

// Água
let geoAgua, verticesOnda = [];

// Relógio > para animação das ondas
let clock;

// Barco
let barco, isFloatingLeft = true, isFloatingUp = true;

// Carregador de texturas
const textureLoader = new THREE.TextureLoader();

window.onload = function init() {
    scene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.x = 0;
    camera.position.y = 13;
    camera.position.z = 81.5;
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor("cyan");
    document.body.appendChild(renderer.domElement);
    
    scene = new THREE.Scene();

    // Controlos
    controls = new OrbitControls(camera, renderer.domElement);

    // Luzes
    // Luz hemisfério
    const light1 = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    light1.position.z = -5;
    scene.add(light1);

    // Luz spotlight
    let light2 = new THREE.SpotLight(0xffffff);
    light2.angle = Math.PI;
    light2.position.z = 35;
    light2.position.y = -15;
    light2.intensity = .5;
    light2.penumbra = 1;
    scene.add(light2);

    // Fundo do oceano
    const geoFundoOceano = new THREE.PlaneGeometry(500, 100);
    const matFundoOceano = new THREE.MeshPhongMaterial({
        transparent: true,
        opacity: 1,
        color: "#4771A8",
        side: THREE.DoubleSide
    });
    const meshFundoOceano = new THREE.Mesh(geoFundoOceano, matFundoOceano);
    meshFundoOceano.position.z = -25;
    meshFundoOceano.position.y = -51;
    scene.add(meshFundoOceano);

    // Água (cortesia de prisoner849: https://jsfiddle.net/prisoner849/79z8jyLk/)
    geoAgua = new THREE.PlaneGeometry(500, 100, 100, 100);
    geoAgua.rotateX(-Math.PI * 0.5);

    // Água: posição das ondas inical
    const v3 = new THREE.Vector3();
    for (let i = 0; i < geoAgua.attributes.position.count; i++) {
        v3.fromBufferAttribute(geoAgua.attributes.position, i);
        verticesOnda.push({
            initH: v3.y,
            amplitude: THREE.MathUtils.randFloatSpread(2),
            phase: THREE.MathUtils.randFloat(0, Math.PI)
        });
    }

    const matAgua = new THREE.MeshLambertMaterial({color: "#2384eb"});
    const meshAgua = new THREE.Mesh(geoAgua, matAgua);
    meshAgua.position.z = -25;
    scene.add(meshAgua);

    // Céu e sol (https://threejs.org/examples/webgl_shaders_sky.html)
    ceu = new Sky();
    ceu.scale.setScalar( 450000 );
    scene.add(ceu);

    sol = new THREE.Vector3();

    ceu.material.uniforms['turbidity'].value = 0;
    ceu.material.uniforms['rayleigh'].value = 0.5;
    ceu.material.uniforms['mieCoefficient'].value = 0.005;
    ceu.material.uniforms['mieDirectionalG'].value = 0.7;
    sol.setFromSphericalCoords(1, THREE.MathUtils.degToRad(85), THREE.MathUtils.degToRad(180));
    ceu.material.uniforms['sunPosition'].value.copy(sol);

    // Barco
    barco = new THREE.Group();

    const barcoBaseColor = textureLoader.load('./images/textures/wood/Wood_Floor_007_COLOR.jpg');
    barcoBaseColor.wrapS = THREE.MirroredRepeatWrapping;
    barcoBaseColor.wrapT = THREE.MirroredRepeatWrapping;
    barcoBaseColor.repeat.set(15, 1)
    const barcoDisplacement = textureLoader.load('./images/textures/wood/Wood_Floor_007_DISP.png');
    const barcoNormal = textureLoader.load('./images/textures/wood/Wood_Floor_007_NORM.jpg');
    const barcoOcclusion = textureLoader.load('./images/textures/wood/Wood_Floor_007_OCC.jpg');
    const barcoRoughness = textureLoader.load('./images/textures/wood/Wood_Floor_007_ROUGH.jpg');

    // Parte de baixo do barco
    const barcoParteBaixo = new THREE.Mesh(
        new THREE.BoxGeometry(50, 2, 15),
        new THREE.MeshPhongMaterial({
            color: "brown",
            map: barcoBaseColor,
            displacementMap: barcoDisplacement,
            displacementScale: 0,
            normalMap: barcoNormal,
            aoMap: barcoOcclusion,
            roughnessMap: barcoRoughness,
            roughness: 1
        })
    );
    barco.add(barcoParteBaixo);

    // Lado esquerdo do barco
    const barcoParteEsquerda = new THREE.Mesh(
        new THREE.BoxGeometry(50, 10, 2),
        new THREE.MeshPhongMaterial({
            color: "brown",
            map: barcoBaseColor,
            displacementMap: barcoDisplacement,
            displacementScale: 0,
            normalMap: barcoNormal,
            aoMap: barcoOcclusion,
            roughnessMap: barcoRoughness,
            roughness: 1
        })
    );
    barcoParteEsquerda.position.z = 7.5;
    barcoParteEsquerda.position.y = 4;
    barco.add(barcoParteEsquerda);

    // Lado direito do barco
    const barcoParteDireita = new THREE.Mesh(
        new THREE.BoxGeometry(50, 10, 2),
        new THREE.MeshPhongMaterial({
            color: "brown",
            map: barcoBaseColor,
            displacementMap: barcoDisplacement,
            displacementScale: 0,
            normalMap: barcoNormal,
            aoMap: barcoOcclusion,
            roughnessMap: barcoRoughness,
            roughness: 1
        })
    );
    barcoParteDireita.position.z = -7.5;
    barcoParteDireita.position.y = 4;
    barco.add(barcoParteDireita);

    // Objeto 3D Barco
    barco.position.y = 0;
    scene.add(barco);

    const barcoHelper = new THREE.AxesHelper(25);
    barco.add(barcoHelper);

    // Relógio > para animação das ondas e do barco
    clock = new THREE.Clock();
    
    // Renderizar
    renderer.setAnimationLoop(render);
}

function render() {
    // console.log(camera.position)
    // Animação da onda a cada render executado
    verticesOnda.forEach((vd, idx) => {
        geoAgua.attributes.position.setY(idx, (vd.initH + Math.sin(clock.getElapsedTime() + vd.phase) * vd.amplitude));
    });
    geoAgua.attributes.position.needsUpdate = true;
    geoAgua.computeVertexNormals();

    // Animação do barco
    if (isFloatingLeft) {
        // O barco está a flutuar para a esquerda
        // Verificar se já atingiu o ponto máximo de flutuação
        barco.rotation.z -= 0.0009;
        if (barco.rotation.z <= -0.05) {
            isFloatingLeft = false;
        }
    } else {
        barco.rotation.z += 0.0005;
        if (barco.rotation.z >= 0.05) {
            isFloatingLeft = true;
        }
    }

    if (isFloatingUp) {
        barco.position.y += 0.01;
        if (barco.position.y >= 1) {
            isFloatingUp = false;
        }
    } else {
        barco.position.y -= 0.01;
        if (barco.position.y <= -1) {
            isFloatingUp = true;
        }
    }

    renderer.render(scene, camera);
}

window.addEventListener("resize", function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
});