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

let peixe;

let homem;

let bracos;

let cabelo, isMovingLeft = true;

let barba,  isBeardMoving = true;

let maxAngleBarbatana=false;
let maxAngleBarbatana2=false;
let maxAngleCauda=false;
let maximoAlcance=false;
let maximoAlcance2=false;

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


    
    //Peixe Centro

    peixe= new THREE.Group();

    const geometryCorpo = new THREE.BoxGeometry(20, 10, 10);
 	const materialCorpo = new THREE.MeshLambertMaterial({
        color: 0x80f5fe ,
        shading: THREE.FlatShading
    });
    const peixeCorpo = new THREE.Mesh(geometryCorpo, materialCorpo);
    peixe.add(peixeCorpo);

    // cauda
    const geometry = new THREE.CylinderGeometry(0, 5, 5, 4 );
    const material = new THREE.MeshLambertMaterial( {color: 0xffff00} );
    peixe.cauda = new THREE.Mesh( geometry, material );
    peixe.cauda.position.x = -12; 
    peixe.cauda.scale.set(2,1.5,.1);
    peixe.cauda.rotation.z = -(Math.PI/2);
    peixe.add(peixe.cauda);

    //barbatana lateral 1
    peixe.barbatana1 = new THREE.Mesh(geometry, material);
    peixe.barbatana1.scale.set(.8,1,.1);
    peixe.barbatana1.position.x = 0; 
    peixe.barbatana1.rotation.x = 0; 
    peixe.barbatana1.position.y = 0; 
    peixe.barbatana1.rotation.y = THREE.MathUtils.degToRad(50); 
    peixe.barbatana1.position.z = 6;
    peixe.barbatana1 .rotation.z = -(Math.PI/2);
    peixe.add(peixe.barbatana1);

    //barbatana lateral 2
    peixe.barbatana2 = new THREE.Mesh(geometry, material);
    peixe.barbatana2.scale.set(.8,1,.1);
    peixe.barbatana2.position.x = 0; 
    peixe.barbatana2.rotation.x = 0; 
    peixe.barbatana2.position.y = 0; 
    peixe.barbatana2.position.z = -6;
    peixe.barbatana2 .rotation.z = (Math.PI/2);
    peixe.barbatana2.rotation.y= (THREE.MathUtils.degToRad(140));
    peixe.add(peixe.barbatana2);


    //cabeca 

    const geometryCabeca = new THREE.ConeGeometry( 7.1, 10, 4 );
    const materialCabeca = new THREE.MeshLambertMaterial( {color: 0xffff00} );
    const peixeCabeca = new THREE.Mesh(geometryCabeca, materialCabeca);
    
    peixeCabeca.position.x = 15;
    peixeCabeca.rotation.x = -(Math.PI/4);
    peixeCabeca.rotation.z = -(Math.PI/2);
    
    peixe.add(peixeCabeca);

    //olho 1
    const geometryOlho = new THREE.BoxGeometry(1.5, 1.5, .1);
 	const materialOlho = new THREE.MeshLambertMaterial({
        color: "#000000" ,
        shading: THREE.FlatShading
    });
    const peixeOlho = new THREE.Mesh(geometryOlho, materialOlho);
    peixeOlho.position.x = 12;
    peixeOlho.position.y = 2;
    peixeOlho.position.z = 4;
    peixe.add(peixeOlho);

    //olho 2
    const peixeOlho2 = new THREE.Mesh(geometryOlho, materialOlho);
    peixeOlho2.position.x = 12;
    peixeOlho2.position.y = 2;
    peixeOlho2.position.z = -4;
    peixe.add(peixeOlho2);

    //Tronco Homem
    homem = new THREE.Group();
    const geometryCorpoHomem = new THREE.CylinderGeometry( 3, 4, 8, 5, 4 );
 	const materialCorpoHomem = new THREE.MeshLambertMaterial({
        color: "yellow" ,
    });
    
    const homemCorpo = new THREE.Mesh(geometryCorpoHomem, materialCorpoHomem);
    homemCorpo.rotation.y = -(Math.PI)/2
    homem.add(homemCorpo);


    //Braço Esquerda
    bracos = new THREE.Group();
    const geometryBracoEHomem = new THREE.CylinderGeometry(1, 0.7 , 10);
    geometryBracoEHomem.rotateX(-0.2)
    geometryBracoEHomem.rotateZ(1)
 	const materialBracoEHomem = new THREE.MeshLambertMaterial({
        color: "yellow" ,
        shading: THREE.FlatShading
    });

    const homemBracoE = new THREE.Mesh(geometryBracoEHomem, materialBracoEHomem);
    homemBracoE.position.x = 3;
    homemBracoE.position.y = 0;
    homemBracoE.position.z = -3;
    bracos.add(homemBracoE);

    //Mão Esquerda
    const geometryMaoEHomem = new THREE.SphereGeometry(0.7);
 	const materialMaoEHomem = new THREE.MeshLambertMaterial({
        color: "pink" ,
        shading: THREE.FlatShading
    });

    const homemMaoE = new THREE.Mesh(geometryMaoEHomem, materialMaoEHomem);
    homemMaoE.position.x = 7;
    homemMaoE.position.y = -2.6;
    homemMaoE.position.z = -2;
    bracos.add(homemMaoE);

    //Braço Direita
    const geometryBracoDHomem = new THREE.CylinderGeometry(1, 0.7 , 10);
    geometryBracoDHomem.rotateX(0.2)
    geometryBracoDHomem.rotateZ(1)
 	const materialBracoDHomem = new THREE.MeshLambertMaterial({
        color: "yellow" ,
        shading: THREE.FlatShading
    });

    const homemBracoD = new THREE.Mesh(geometryBracoDHomem, materialBracoDHomem);
    homemBracoD.position.x = 3;
    homemBracoD.position.y = 0;
    homemBracoD.position.z = 3;
    bracos.add(homemBracoD);

    //Mão Direita
    const geometryMaoDHomem = geometryMaoEHomem.clone();
 	const materialMaoDHomem = new THREE.MeshLambertMaterial({
        color: "pink" ,
        shading: THREE.FlatShading
    });

    const homemMaoD = new THREE.Mesh(geometryMaoDHomem, materialMaoDHomem);
    homemMaoD.position.x = 7;
    homemMaoD.position.y = -2.6;
    homemMaoD.position.z = 2;
    bracos.add(homemMaoD);

    //Perna Esquerda 1
    const geometryPernaEHomem1 = new THREE.BoxGeometry(9, 2.4, 2.4);
 	const materialPernaEHomem1 = new THREE.MeshLambertMaterial({
        color: "black" ,
        shading: THREE.FlatShading
    });

    const homemPernaE1 = new THREE.Mesh(geometryPernaEHomem1, materialPernaEHomem1);
    homemPernaE1.position.x = 1.5;
    homemPernaE1.position.y = -5.2;
    homemPernaE1.position.z = -2;
    homem.add(homemPernaE1);

    //Perna Direita 1
    const geometryPernaDHomem1 = geometryPernaEHomem1.clone();
 	const materialPernaDHomem1 = new THREE.MeshLambertMaterial({
        color: "black" ,
        shading: THREE.FlatShading
    });

    const homemPernaD1 = new THREE.Mesh(geometryPernaDHomem1, materialPernaDHomem1);
    homemPernaD1.position.x = 1.5;
    homemPernaD1.position.y = -5.2;
    homemPernaD1.position.z = 2;
    homem.add(homemPernaD1);

    //Perna Esquerda 2
    const geometryPernaEHomem2 = new THREE.BoxGeometry(3, 2.4, 2.4);
 	const materialPernaEHomem2 = new THREE.MeshLambertMaterial({
        color: "black" ,
        shading: THREE.FlatShading
    });

    const homemPernaE2 = new THREE.Mesh(geometryPernaEHomem2, materialPernaEHomem2);
    homemPernaE2.position.x = 4.5;
    homemPernaE2.position.y = -7.7;
    homemPernaE2.position.z = -2;
    homem.add(homemPernaE2);

    //Perna Direita 2
    const geometryPernaDHomem2 = geometryPernaEHomem2.clone();
 	const materialPernaDHomem2 = new THREE.MeshLambertMaterial({
        color: "black" ,
        shading: THREE.FlatShading
    });

    const homemPernaD2 = new THREE.Mesh(geometryPernaDHomem2, materialPernaDHomem2);
    homemPernaD2.position.x = 4.5;
    homemPernaD2.position.y = -7.7;
    homemPernaD2.position.z = 2;
    homem.add(homemPernaD2);

    //Cabeça Homem
    const geometryCabecaHomem = new THREE.SphereGeometry(3, 5, 4);
 	const materialCabecaHomem = new THREE.MeshLambertMaterial({
        color: "pink" ,
    });
    const homemCabeca = new THREE.Mesh(geometryCabecaHomem, materialCabecaHomem);
    homemCabeca.position.y = 6.5;
    homem.add(homemCabeca);

    //Cabelo1
    cabelo = new THREE.Group();
    const geometryCabeloHomem1 = new THREE.ConeGeometry(0.5, 1.5, 4);
 	const materialCabeloHomem1 = new THREE.MeshLambertMaterial({
        color: "brown" ,
    });
    const homemCabelo1 = new THREE.Mesh(geometryCabeloHomem1, materialCabeloHomem1);
    homemCabelo1.position.x = 1.5;
    homemCabelo1.position.y = 9;
    // homemCabelo1.rotation.y = -0.30 
    cabelo.add(homemCabelo1);

    //Cabelo2
    const geometryCabeloHomem2 = geometryCabeloHomem1.clone();
 	const materialCabeloHomem2 = new THREE.MeshLambertMaterial({
        color: "brown" ,
    });
    const homemCabelo2 = new THREE.Mesh(geometryCabeloHomem2, materialCabeloHomem2);
    homemCabelo2.position.x = 1;
    homemCabelo2.position.y = 9.5;
    // homemCabelo1.rotation.y = -0.30 
    cabelo.add(homemCabelo2);

    //Cabelo3
    const geometryCabeloHomem3 = geometryCabeloHomem1.clone();
 	const materialCabeloHomem3 = new THREE.MeshLambertMaterial({
        color: "brown" ,
    });
    const homemCabelo3 = new THREE.Mesh(geometryCabeloHomem3, materialCabeloHomem3);
    homemCabelo3.position.x = 0.5;
    homemCabelo3.position.y = 9.7;
    // homemCabelo1.rotation.y = -0.30 
    cabelo.add(homemCabelo3);

    //Cabelo4
    const geometryCabeloHomem4 = geometryCabeloHomem1.clone();
 	const materialCabeloHomem4 = new THREE.MeshLambertMaterial({
        color: "brown" ,
    });
    const homemCabelo4 = new THREE.Mesh(geometryCabeloHomem4, materialCabeloHomem4);
    homemCabelo4.position.x = 0;
    homemCabelo4.position.y = 9.9;
    // homemCabelo1.rotation.y = -0.30 
    cabelo.add(homemCabelo4);

    //Cabelo5
    const geometryCabeloHomem5 = geometryCabeloHomem1.clone();
 	const materialCabeloHomem5 = new THREE.MeshLambertMaterial({
        color: "brown" ,
    });
    const homemCabelo5 = new THREE.Mesh(geometryCabeloHomem5, materialCabeloHomem5);
    homemCabelo5.position.x = -0.5;
    homemCabelo5.position.y = 9.7;
    // homemCabelo1.rotation.y = -0.30 
    cabelo.add(homemCabelo5);

    //Cabelo6
    const geometryCabeloHomem6 = geometryCabeloHomem1.clone();
 	const materialCabeloHomem6 = new THREE.MeshLambertMaterial({
        color: "brown" ,
    });
    const homemCabelo6 = new THREE.Mesh(geometryCabeloHomem6, materialCabeloHomem6);
    homemCabelo6.position.x = -1;
    homemCabelo6.position.y = 9.5;
    // homemCabelo1.rotation.y = -0.30 
    cabelo.add(homemCabelo6);

    //Cabelo7
    const geometryCabeloHomem7 = geometryCabeloHomem1.clone();
 	const materialCabeloHomem7 = new THREE.MeshLambertMaterial({
        color: "brown" ,
    });
    const homemCabelo7 = new THREE.Mesh(geometryCabeloHomem7, materialCabeloHomem7);
    homemCabelo7.position.x = -1.5;
    homemCabelo7.position.y = 9;
    // homemCabelo1.rotation.y = -0.30 
    cabelo.add(homemCabelo7);


    //olho direita
    const geometryOlhoDHomem = new THREE.SphereGeometry(0.1);
 	const materialOlhoDHomem = new THREE.MeshLambertMaterial({
        color: "green" ,
        shading: THREE.FlatShading
    });
    const homemOlhoD = new THREE.Mesh(geometryOlhoDHomem, materialOlhoDHomem);
    homemOlhoD.position.x = 2.2;
    homemOlhoD.position.y = 7.5;
    homemOlhoD.position.z = 1;
    homem.add(homemOlhoD);

    //olho direitaBranco
    const geometryOlhoDBHomem = new THREE.SphereGeometry(0.3);
 	const materialOlhoDBHomem = new THREE.MeshLambertMaterial({
        color: "White" ,
        shading: THREE.FlatShading
    });
    const homemOlhoDB = new THREE.Mesh(geometryOlhoDBHomem, materialOlhoDBHomem);
    homemOlhoDB.position.x = 1.92;
    homemOlhoDB.position.y = 7.5;
    homemOlhoDB.position.z = 1;
    homem.add(homemOlhoDB);

    //olho esquerda
    const geometryOlhoEHomem = geometryOlhoDHomem.clone()
 	const materialOlhoEHomem = new THREE.MeshLambertMaterial({
        color: "green" ,
        shading: THREE.FlatShading
    });
    const homemOlhoE = new THREE.Mesh(geometryOlhoEHomem, materialOlhoEHomem);
    homemOlhoE.position.x = 2.2;
    homemOlhoE.position.y = 7.5;
    homemOlhoE.position.z = -1;
    homem.add(homemOlhoE);

    //olho EsquerdaBranco
    const geometryOlhoEBHomem = geometryOlhoDBHomem.clone();
 	const materialOlhoEBHomem = new THREE.MeshLambertMaterial({
        color: "White" ,
    });
    const homemOlhoEB = new THREE.Mesh(geometryOlhoEBHomem, materialOlhoEBHomem);
    homemOlhoEB.position.x = 1.92;
    homemOlhoEB.position.y = 7.5;
    homemOlhoEB.position.z = -1;
    homem.add(homemOlhoEB);

    //nariz
    const geometryNarizHomem = new THREE.ConeGeometry(0.3, 1);
 	const materialNarizHomem = new THREE.MeshLambertMaterial({
        color: "black" ,
        shading: THREE.FlatShading
    });
    const homemNariz = new THREE.Mesh(geometryNarizHomem, materialNarizHomem);
    homemNariz.position.x = 2.3;
    homemNariz.position.y = 6.7;
    homem.add(homemNariz);

    //boca
    barba = new THREE.Group();
    const geometryBocaHomem = new THREE.BoxGeometry(0.5, 0.5, 2);
 	const materialBocaHomem = new THREE.MeshLambertMaterial({
        color: "brown" ,
        shading: THREE.FlatShading
    });
    const homemBoca = new THREE.Mesh(geometryBocaHomem, materialBocaHomem);
    homemBoca.position.x = 1.92;
    homemBoca.position.y = 5;
    barba.add(homemBoca);

    //bocabaixo
    const geometryBocaDupHomem = new THREE.BoxGeometry(0.5, 0.5, 2);
 	const materialBocaDupHomem = new THREE.MeshLambertMaterial({
        color: "brown" ,
        shading: THREE.FlatShading
    });
    const homemBocaDup = new THREE.Mesh(geometryBocaDupHomem, materialBocaDupHomem);
    homemBocaDup.position.x = 1.92;
    homemBocaDup.position.y = 4.5;
    barba.add(homemBocaDup);

    //bocabaixo2
    const geometryBocaDupHomem2 = new THREE.BoxGeometry(0.5, 0.5, 1);
 	const materialBocaDupHomem2 = new THREE.MeshLambertMaterial({
        color: "brown" ,
        shading: THREE.FlatShading
    });
    const homemBocaDup2 = new THREE.Mesh(geometryBocaDupHomem2, materialBocaDupHomem2);
    homemBocaDup2.position.x = 2.2;
    homemBocaDup2.position.y = 4;
    barba.add(homemBocaDup2);

    //Boca 2
    const geometryBocaHomem2 = new THREE.BoxGeometry(0.5, 1, 0.5);
 	const materialBocaHomem2 = new THREE.MeshLambertMaterial({
        color: "brown" ,
        shading: THREE.FlatShading
    });
    const homemBoca2 = new THREE.Mesh(geometryBocaHomem2, materialBocaHomem2);
    homemBoca2.position.x = 1.92;
    homemBoca2.position.y = 5.3;
    homemBoca2.position.z = -1;
    barba.add(homemBoca2);

    //boca 3
    const geometryBocaHomem3 = new THREE.BoxGeometry(0.5, 1, 0.5);
 	const materialBocaHomem3 = new THREE.MeshLambertMaterial({
        color: "brown" ,
        shading: THREE.FlatShading
    });
    const homemBoca3 = new THREE.Mesh(geometryBocaHomem3, materialBocaHomem3);
    homemBoca3.position.x = 1.92;
    homemBoca3.position.y = 5.3;
    homemBoca3.position.z = 1;
    barba.add(homemBoca3);

    //lingua
    const geometryLinguaHomem = new THREE.BoxGeometry(0.3, 0.1, 1.5);
 	const materialLinguaHomem3 = new THREE.MeshLambertMaterial({
        color: "white" ,
        shading: THREE.FlatShading
    });
    const homemLingua = new THREE.Mesh(geometryLinguaHomem, materialLinguaHomem3);
    homemLingua.position.x = 2.1;
    homemLingua.position.y = 5.3;
    homem.add(homemLingua);

    

    //Objeto 3D Homem
    homem.position.y = 12;
    homem.position.x = 10;
    homem.rotation.y = 0
    homem.add(barba)
    homem.add(cabelo);
    homem.add(bracos);
    scene.add(homem);


    // Objeto 3D Peixe
    peixe.position.y = -40;
    peixe.scale.set(.4,.4,.4);
    scene.add(peixe);

  
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
   
    if(peixe.position.x>window.innerWidth * .05){
        maximoAlcance=true;
    }
    else if(maximoAlcance==false || maximoAlcance2==true){
        peixe.position.x+=.3
    }
    if(maximoAlcance){
        maximoAlcance2=false;
        peixe.rotation.y=THREE.MathUtils.degToRad(180)
        peixe.position.x-=.3
        if( peixe.position.x<-window.innerWidth * .05){
            peixe.rotation.y=THREE.MathUtils.degToRad(0)
            maximoAlcance2=true;
            maximoAlcance=false;
        }
        
    }
    
    //Barbatana 1
    if((peixe.barbatana1.rotation.y<1) && maxAngleBarbatana==false){
        peixe.barbatana1.rotation.y+=THREE.MathUtils.degToRad(2)
        if(peixe.barbatana1.rotation.y>1){
            maxAngleBarbatana=true;
        }
    }
    if(maxAngleBarbatana){
        if(peixe.barbatana1.rotation.y>0){
            peixe.barbatana1.rotation.y-=THREE.MathUtils.degToRad(2)
        }
        else{
            maxAngleBarbatana=false;
        }
    }
    
   //Barbatana 2
    if((peixe.barbatana2.rotation.y<3.4) && maxAngleBarbatana2==false){
        peixe.barbatana2.rotation.y+=THREE.MathUtils.degToRad(2)
        if(peixe.barbatana2.rotation.y>3.4){
            maxAngleBarbatana2=true;
        }
    }
    if(maxAngleBarbatana2){
        if(peixe.barbatana2.rotation.y>2.4){
            peixe.barbatana2.rotation.y-=THREE.MathUtils.degToRad(2)
        }
        else{
            maxAngleBarbatana2=false;
        }
    }

    //Cauda
    if((peixe.cauda.rotation.y<.5 || peixe.cauda.rotation.y<0) && maxAngleCauda==false){
        peixe.cauda.rotation.y+=THREE.MathUtils.degToRad(2)
        if(peixe.cauda.rotation.y>=.5){
            maxAngleCauda=true;
        }
    }
    if(maxAngleCauda){
        if(peixe.cauda.rotation.y>0){
            peixe.cauda.rotation.y-=THREE.MathUtils.degToRad(2)
        }
        else{
            maxAngleCauda=false;
        }
    }
    


    

    // Aminação do cabelo
    if (isMovingLeft) {
        // O cabelo esta-se mecher para a esquerda
        // Verifica se já atingiu o ponto máximo de oscilação
        cabelo.rotation.z -= 0.0005;
        if (cabelo.rotation.z <= -0.03) {
            isMovingLeft = false;
        }
    } else {
        cabelo.rotation.z += 0.0005;
        if (cabelo.rotation.z >= 0.03) {
            isMovingLeft = true;
        }
    }

    // Aminação da barba
    if (isBeardMoving) {
        // O cabelo esta-se mecher para a esquerda
        // Verifica se já atingiu o ponto máximo de oscilação
        barba.rotation.x -= 0.0002;
        if (barba.rotation.x <= -0.03) {
            isBeardMoving = false;
        }
    } else {
        barba.rotation.x += 0.0002;
        if (barba.rotation.x >= 0.03) {
            isBeardMoving = true;
        }
    }
    

    renderer.render(scene, camera);
}

window.addEventListener("resize", function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
});