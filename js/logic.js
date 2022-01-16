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
    const cylinder = new THREE.Mesh( geometry, material );
    cylinder.position.x = -12; 
    cylinder.scale.set(2,1.5,.3);
    cylinder.rotation.z = -(Math.PI/2);
    peixe.add(cylinder);

    //barbatana lateral 1
    const barbatana1 = new THREE.Mesh(geometry, material);
    barbatana1.scale.set(.8,1,.1);
    barbatana1.position.x = 0; 
    barbatana1.rotation.x = 0; 
    barbatana1.position.y = 0; 
    barbatana1.rotation.y = THREE.MathUtils.degToRad(50); 
    barbatana1.position.z = 6;
    barbatana1.rotation.z = -(Math.PI/2);
    peixe.add(barbatana1);

    //barbatana lateral 2
    const barbatana2 = new THREE.Mesh(geometry, material);
    barbatana2.scale.set(.8,1,.1);
    barbatana2.position.x = 0; 
    barbatana2.rotation.x = 0; 
    barbatana2.position.y = 0; 
    barbatana2.rotation.y = (Math.PI); 
    barbatana2.rotation.y = THREE.MathUtils.degToRad(130); 
    barbatana2.position.z = -6;
    barbatana2.rotation.z = (Math.PI/2);
    peixe.add(barbatana2);


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
    const geometryCorpoHomem = new THREE.BoxGeometry(3, 8, 7);
 	const materialCorpoHomem = new THREE.MeshLambertMaterial({
        color: "yellow" ,
        shading: THREE.FlatShading
    });
    const homemCorpo = new THREE.Mesh(geometryCorpoHomem, materialCorpoHomem);
    homem.add(homemCorpo);

    //Braço Esquerda
    const geometryBracoEHomem = new THREE.BoxGeometry(2, 10, 2);
 	const materialBracoEHomem = new THREE.MeshLambertMaterial({
        color: "blue" ,
        shading: THREE.FlatShading
    });

    const homemBracoE = new THREE.Mesh(geometryBracoEHomem, materialBracoEHomem);
    homemBracoE.position.x = 0;
    homemBracoE.position.y = -2;
    homemBracoE.position.z = -4.5;
    homem.add(homemBracoE);

    //Braço Direita
    const geometryBracoDHomem = new THREE.BoxGeometry(2, 10, 2);
 	const materialBracoDHomem = new THREE.MeshLambertMaterial({
        color: "blue" ,
        shading: THREE.FlatShading
    });

    const homemBracoD = new THREE.Mesh(geometryBracoDHomem, materialBracoDHomem);
    homemBracoD.position.x = 0;
    homemBracoD.position.y = -2;
    homemBracoD.position.z = 4.5;
    homem.add(homemBracoD);

    //Perna Esquerda 1
    const geometryPernaEHomem1 = new THREE.BoxGeometry(6, 2.7, 2.7);
 	const materialPernaEHomem1 = new THREE.MeshLambertMaterial({
        color: "red" ,
        shading: THREE.FlatShading
    });

    const homemPernaE1 = new THREE.Mesh(geometryPernaEHomem1, materialPernaEHomem1);
    homemPernaE1.position.x = 4;
    homemPernaE1.position.y = -5.2;
    homemPernaE1.position.z = -2;
    homem.add(homemPernaE1);

    //Perna Direita 1
    const geometryPernaDHomem1 = new THREE.BoxGeometry(6, 2.7, 2.7);
 	const materialPernaDHomem1 = new THREE.MeshLambertMaterial({
        color: "green" ,
        shading: THREE.FlatShading
    });

    const homemPernaD1 = new THREE.Mesh(geometryPernaDHomem1, materialPernaDHomem1);
    homemPernaD1.position.x = 4;
    homemPernaD1.position.y = -5.2;
    homemPernaD1.position.z = 2;
    homem.add(homemPernaD1);

    //Perna Esquerda 2
    const geometryPernaEHomem2 = new THREE.BoxGeometry(3, 2.7, 2.7);
 	const materialPernaEHomem2 = new THREE.MeshLambertMaterial({
        color: "red" ,
        shading: THREE.FlatShading
    });

    const homemPernaE2 = new THREE.Mesh(geometryPernaEHomem2, materialPernaEHomem2);
    homemPernaE2.position.x = 5.5;
    homemPernaE2.position.y = -7.7;
    homemPernaE2.position.z = -2;
    homem.add(homemPernaE2);

    //Perna Direita 2
    const geometryPernaDHomem2 = new THREE.BoxGeometry(3, 2.7, 2.7);
 	const materialPernaDHomem2 = new THREE.MeshLambertMaterial({
        color: "green" ,
        shading: THREE.FlatShading
    });

    const homemPernaD2 = new THREE.Mesh(geometryPernaDHomem2, materialPernaDHomem2);
    homemPernaD2.position.x = 5.5;
    homemPernaD2.position.y = -7.7;
    homemPernaD2.position.z = 2;
    homem.add(homemPernaD2);

    //Cabeça
    const geometryCabecaHomem = new THREE.BoxGeometry(5, 5, 5);
 	const materialCabecaHomem = new THREE.MeshLambertMaterial({
        color: "orange" ,
        shading: THREE.FlatShading
    });
    const homemCabeca = new THREE.Mesh(geometryCabecaHomem, materialCabecaHomem);
    homemCabeca.position.y = 6.5;
    homem.add(homemCabeca);

    //olho direita
    const geometryOlhoDHomem = new THREE.BoxGeometry(0.5, 0.5, 0.5);
 	const materialOlhoDHomem = new THREE.MeshLambertMaterial({
        color: "black" ,
        shading: THREE.FlatShading
    });
    const homemOlhoD = new THREE.Mesh(geometryOlhoDHomem, materialOlhoDHomem);
    homemOlhoD.position.x = 2.5;
    homemOlhoD.position.y = 7.5;
    homemOlhoD.position.z = 1;
    homem.add(homemOlhoD);

    //olho esquerda
    const geometryOlhoEHomem = new THREE.BoxGeometry(0.5, 0.5, 0.5);
 	const materialOlhoEHomem = new THREE.MeshLambertMaterial({
        color: "black" ,
        shading: THREE.FlatShading
    });
    const homemOlhoE = new THREE.Mesh(geometryOlhoEHomem, materialOlhoEHomem);
    homemOlhoE.position.x = 2.5;
    homemOlhoE.position.y = 7.5;
    homemOlhoE.position.z = -1;
    homem.add(homemOlhoE);

    //nariz
    const geometryNarizHomem = new THREE.BoxGeometry(0.5, 1, 0.5);
 	const materialNarizHomem = new THREE.MeshLambertMaterial({
        color: "black" ,
        shading: THREE.FlatShading
    });
    const homemNariz = new THREE.Mesh(geometryNarizHomem, materialNarizHomem);
    homemNariz.position.x = 2.5;
    homemNariz.position.y = 6.5;
    homem.add(homemNariz);

    //boca
    const geometryBocaHomem = new THREE.BoxGeometry(0.5, 0.5, 2);
 	const materialBocaHomem = new THREE.MeshLambertMaterial({
        color: "red" ,
        shading: THREE.FlatShading
    });
    const homemBoca = new THREE.Mesh(geometryBocaHomem, materialBocaHomem);
    homemBoca.position.x = 2.5;
    homemBoca.position.y = 5;
    homem.add(homemBoca);

    //Boca 2
    const geometryBocaHomem2 = new THREE.BoxGeometry(0.5, 1, 0.5);
 	const materialBocaHomem2 = new THREE.MeshLambertMaterial({
        color: "red" ,
        shading: THREE.FlatShading
    });
    const homemBoca2 = new THREE.Mesh(geometryBocaHomem2, materialBocaHomem2);
    homemBoca2.position.x = 2.5;
    homemBoca2.position.y = 5.5;
    homemBoca2.position.z = -1;
    homem.add(homemBoca2);

    //boca 3
    const geometryBocaHomem3 = new THREE.BoxGeometry(0.5, 1, 0.5);
 	const materialBocaHomem3 = new THREE.MeshLambertMaterial({
        color: "red" ,
        shading: THREE.FlatShading
    });
    const homemBoca3 = new THREE.Mesh(geometryBocaHomem3, materialBocaHomem3);
    homemBoca3.position.x = 2.5;
    homemBoca3.position.y = 5.5;
    homemBoca3.position.z = 1;
    homem.add(homemBoca3);

    

    //Objeto 3D Homem
    homem.position.y = 12;
    homem.position.x = 10;
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