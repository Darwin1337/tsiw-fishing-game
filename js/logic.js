import * as THREE from './three.module.js';
import { Sky } from "./Sky.js";
import * as BufferGeometryUtils from "./BufferGeometryUtils.js"
// Geral
let camera, scene, renderer, controls;

// Sol e céu
let sol, ceu;

// Água
let geoAgua, verticesOnda = [];

// Relógio > para animação das ondas
let clock;

// Barco
let barco, isFloatingLeft = true, isFloatingUp = true, motor, acel = 0;

// Peixe
let peixe, maxAngleBarbatana = false, maxAngleBarbatana2 = false, maxAngleCauda = false, maximoAlcance = false, maximoAlcance2 = false, peixeMordeu = false, shouldBeAnimated = true;

// Homem
let homem, bracos, cabelo, barba, isMovingLeft = true, isBeardMoving = true, isPullingRod = true;

// Cana de pesca
let cana, corda, homemBracoD, geoCorda, matCorda, ancora, isco, initVal = 50, isDangling = true;

// Array que irá ficar com as teclas pressionadas
let keys = new Array();

// Ligar a hitbox do peixe
let hitboxPeixe = false;

// Carregador de texturas
const textureLoader = new THREE.TextureLoader();

window.onload = function init() {
    scene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.x = 0;
    camera.position.y = 16;
    camera.position.z = 81.5;
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor("cyan");
    document.body.appendChild(renderer.domElement);
    
    scene = new THREE.Scene();

    // Luzes
    criarLuzes();

    // Água e fundo do oceano
    criarAgua();

    // Céu
    criarCeu();
    
    // Barco
    criarBarco();

    // Peixe
    criarPeixe();

    // Homem
    criarHomem();

    // Cana
    criarCana();

    // Relógio > para animação das ondas e do barco
    clock = new THREE.Clock();
    
    // Renderizar
    renderer.setAnimationLoop(render);
}

function render() {
    // Animações
    animacaoMar();
    animacaoBarco();
    animacaoCana();
    animacaoPeixe();
    animacaoHomem();

    // Lidar com os controlos do teclado
    mapearControlos();

    // Lidar com a colisão do peixe com o isco
    colisaoPeixeIsco();

    renderer.render(scene, camera);
}

function aumentarCorda(a) {
    // a = tamanho que vai ser aumentado à corda

    // Animação dos braços
    if (isPullingRod) {
        homemBracoD.rotation.z += 0.009;
        homemBracoD.position.x += 0.07;
        if (homemBracoD.rotation.z > 0.15) {
            isPullingRod = false;
        }
    } else {
        homemBracoD.rotation.z -= 0.009;
        homemBracoD.position.x -= 0.07;
        if (homemBracoD.rotation.z <= -0.05) {
            isPullingRod = true;
        }
    }

    if ((keys["ArrowUp"] && initVal > 30) || (keys["ArrowDown"] && initVal < 100)) {
        initVal += a;
        cana.lastPos = corda.position.y - (a / 2);
        isco.posy -= a;
    }

    ancora.remove(corda);
    geoCorda = new THREE.CylinderGeometry(.05, .05, initVal, 32);
    matCorda = new THREE.MeshPhongMaterial({ color: 0x26AFB7 });
    corda = new THREE.Mesh(geoCorda, matCorda);
    isco.position.y = cana.lastPos;
    corda.position.y = cana.lastPos;
    corda.add(isco);
    ancora.add(corda);
}

function peixeMordeuIsco(x1, y1, x2, y2, r1, r2) {
    // PDF 07_OBJECTS_COLLISIONS, pág. 20/29
    return (Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) < r1 + r2) ? true : false;
}

function colisaoPeixeIsco() {
    // console.log("Isco: " + isco.posx + " : " + isco.posy);
    // console.log("Peixe: " + peixe.position.x + " : " + peixe.position.y);

    // Para ativar a hitbox do peixe settar a seguinte variavel a true
    // hitboxPeixe = true;

    // Verificar se o peixe mordeu o isco
    if (peixeMordeuIsco(peixe.position.x, peixe.position.y, isco.posx, isco.posy, 7, 1) || peixeMordeu) {
        peixeMordeu = true;
        shouldBeAnimated = false;
        scene.remove(peixe);
        ancora.add(peixe);
        peixe.position.x = corda.position.x;
        peixe.position.y = isco.posy - 42;
        peixe.rotation.z = Math.PI / 2;
        if (peixe.position.y >= -34.5) {
            document.querySelector("#quantity").innerHTML = parseInt(document.querySelector("#quantity").innerHTML) + 1;
            ancora.remove(peixe);
            scene.add(peixe);
            peixe.rotation.z = 0;
            peixe.position.y = -40;
            peixe.position.x = 0;
            peixeMordeu = false;
            shouldBeAnimated = true;

            if (!maximoAlcance) {
                maximoAlcance = true;
            }
            if (!maximoAlcance2) {
                maximoAlcance2 = true;
            }
        }
    }
}

function criarLuzes() {
    // Luzes
    // Luz hemisfério
    const light1 = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    light1.position.z = -5;
    scene.add(light1);

    // Luz spotlight
    const light2 = new THREE.SpotLight(0xffffff);
    light2.angle = Math.PI;
    light2.position.z = 35;
    light2.position.y = -20;
    light2.intensity = .5;
    light2.penumbra = 1;
    scene.add(light2);

    const light3 = new THREE.DirectionalLight(0xffffff, 0.5 );
    light3.position.z = -100;
    light3.position.y = 100;
    light3.castShadow = true;
    scene.add(light3);
}

function criarBarco() {
    // Barco
    // Irá ser utilizado o BufferGeometryUtils porque todas as geometrias do barco irão ter o mesmo material
    let barcoGeometries = [];

    // Texturas do barco
    const barcoBaseColor = textureLoader.load('./images/textures/wood/Wood_Barrel_Top_001_basecolor.jpg');
    barcoBaseColor.wrapS = THREE.MirroredRepeatWrapping;
    barcoBaseColor.wrapT = THREE.MirroredRepeatWrapping;
    // const barcoDisplacement = textureLoader.load('./images/textures/wood/Wood_Floor_007_DISP.png');
    const barcoNormal = textureLoader.load('./images/textures/wood/Wood_Barrel_Top_001_normal.jpg');
    barcoNormal.wrapS = THREE.MirroredRepeatWrapping;
    barcoNormal.wrapT = THREE.MirroredRepeatWrapping;
    const barcoOcclusion = textureLoader.load('./images/textures/wood/Wood_Barrel_Top_001_ambientOcclusion.jpg');
    barcoOcclusion.wrapS = THREE.MirroredRepeatWrapping;
    barcoOcclusion.wrapT = THREE.MirroredRepeatWrapping;
    const barcoHeight = textureLoader.load('./images/textures/wood/Wood_Barrel_Top_001_height.png');
    barcoHeight.wrapS = THREE.MirroredRepeatWrapping;
    barcoHeight.wrapT = THREE.MirroredRepeatWrapping;
    const barcoAlpha = textureLoader.load('./images/textures/wood/Wood_Barrel_Top_001_opacity.jpg');
    barcoAlpha.wrapS = THREE.MirroredRepeatWrapping;
    barcoAlpha.wrapT = THREE.MirroredRepeatWrapping;

    // Lado esquerdo do barco
    const ladoE1 = new THREE.BoxGeometry(30, 10, 2);
    ladoE1.translate(0, 4, 7.5);
    barcoGeometries.push(ladoE1);

    const ladoE2 = new THREE.BoxGeometry(5, 10, 2);
    ladoE2.translate(-14.8, 4, 10.92);
    ladoE2.rotateY(-0.25);
    barcoGeometries.push(ladoE2);

    const ladoE3 =new THREE.BoxGeometry(5, 10, 2);
    ladoE3.translate(-16.2, 4, 14.82);
    ladoE3.rotateY((Math.PI * 2) - 0.50);
    barcoGeometries.push(ladoE3);

    const ladoE4 = new THREE.BoxGeometry(10, 10, 2);
    ladoE4.translate(-23.7, 4, 14.82);
    ladoE4.rotateY((Math.PI * 2) - 0.50);
    barcoGeometries.push(ladoE4);

    // Lado direito do barco
    const ladoD1 = new THREE.BoxGeometry(30, 10, 2);
    ladoD1.translate(0, 4, -10.72);
    barcoGeometries.push(ladoD1);;

    const ladoD2 = new THREE.BoxGeometry(5, 10, 2);
    ladoD2.translate(-14.1, 4, -14.07);
    ladoD2.rotateY(0.25);
    barcoGeometries.push(ladoD2);

    const ladoD3 = new THREE.BoxGeometry(5, 10, 2);
    ladoD3.translate(-14.7, 4, -17.7);
    ladoD3.rotateY((Math.PI * 2) + 0.50);
    barcoGeometries.push(ladoD3);

    const ladoD4 = new THREE.BoxGeometry(10, 10, 2);
    ladoD4.translate(-22.2, 4, -17.7);
    ladoD4.rotateY((Math.PI * 2) + 0.50);
    barcoGeometries.push(ladoD4);

    // Parte de trás do barco
    const tras1 = new THREE.BoxGeometry(20.22, 10, 2);
    tras1.translate(1.6, 4, 16);
    tras1.rotateY(Math.PI / 2);
    barcoGeometries.push(tras1);

    // Estaca
    const estaca = new THREE.BoxGeometry(5, 2, 18.22);
    estaca.translate(4, 6, -1.5);
    barcoGeometries.push(estaca);

    //Motor do barco
    const geometryMotorBarco = new THREE.CylinderGeometry(1, 1 , 2);
    const materialMotorBarco = new THREE.MeshLambertMaterial({
            color: "grey"
        });

    motor = new THREE.Mesh(geometryMotorBarco, materialMotorBarco);

    //Pás do Motor Barco 1
    const geometryMotorPA1 = new THREE.BoxGeometry(1, 5, 0.5);
    const materialMotorPA1 = new THREE.MeshLambertMaterial({
        color: "grey"
    });

    const MotorPA1 = new THREE.Mesh(geometryMotorPA1, materialMotorPA1);
    MotorPA1.rotation.z = Math.PI;
    MotorPA1.rotation.x = Math.PI / 2;
    MotorPA1.position.set(0, -1, -2);
    motor.add(MotorPA1);

    //Pás do Motor Barco 2
    const geometryMotorPA2 = geometryMotorPA1.clone();
        const materialMotorPA2 = new THREE.MeshLambertMaterial({
        color: "grey"
    });

    const MotorPA2 = new THREE.Mesh(geometryMotorPA2, materialMotorPA2);
    MotorPA2.rotation.z = Math.PI;
    MotorPA2.rotation.x = Math.PI / 2;
    MotorPA2.position.set(0, -1, 2);
    motor.add(MotorPA2);

    //Pás do Motor Barco 3
    const geometryMotorPA3 = geometryMotorPA1.clone();
        const materialMotorPA3 = new THREE.MeshLambertMaterial({
        color: "grey"
    });

    const MotorPA3 = new THREE.Mesh(geometryMotorPA3, materialMotorPA3);
    MotorPA3.rotation.z = Math.PI / 2;
    MotorPA3.rotation.x = Math.PI / 2;
    MotorPA3.position.set(2, -1, 0);
    motor.add(MotorPA3);

    //Pás do Motor Barco 4
    const geometryMotorPA4 = geometryMotorPA1.clone();
    const materialMotorPA4 = new THREE.MeshLambertMaterial({
        color: "grey"
    });

    const MotorPA4 = new THREE.Mesh(geometryMotorPA4, materialMotorPA4);
    MotorPA4.rotation.z = Math.PI / 2;
    MotorPA4.rotation.x = Math.PI / 2;
    MotorPA4.position.set(-2, -1, 0);
    motor.add(MotorPA4);


    const barcoJunto = BufferGeometryUtils.mergeBufferGeometries(barcoGeometries);
    barco = new THREE.Mesh(barcoJunto, new THREE.MeshPhongMaterial({
        color: 0xD99969,
        map: barcoBaseColor,
        normalMap: barcoNormal,
        aoMap: barcoOcclusion,
        alphaMap: barcoAlpha,
        bumpMap: barcoHeight
    }));

    // Objeto barco
    motor.position.set(18, 2, -1);
    motor.rotation.z = Math.PI / 2;
    // motor.add(pas);
    barco.add(motor);
    scene.add(barco);
}

function criarPeixe() {
    // Objeto peixe
    peixe = new THREE.Group();

    // Peixe centro
    const peixeCorpo = new THREE.Mesh(
        new THREE.BoxGeometry(20, 10, 10),
        new THREE.MeshLambertMaterial({ color: 0x80f5fe })
    );
    peixe.add(peixeCorpo);

    // Cauda
    peixe.cauda = new THREE.Mesh(
        new THREE.CylinderGeometry(0, 5, 5, 4 ),
        new THREE.MeshLambertMaterial( {color: 0xffff00} )
    );
    peixe.cauda.position.x = -12; 
    peixe.cauda.scale.set(2,1.5,.3);
    peixe.cauda.rotation.z = -(Math.PI/2);
    peixe.add(peixe.cauda);

    // Barbatana lateral 1
    peixe.barbatana1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0, 5, 5, 4 ),
        new THREE.MeshLambertMaterial( {color: 0xffff00} )
    );
    peixe.barbatana1.scale.set(.8,1,.1);
    peixe.barbatana1.position.x = 0; 
    peixe.barbatana1.rotation.x = 0; 
    peixe.barbatana1.position.y = 0; 
    peixe.barbatana1.rotation.y = THREE.MathUtils.degToRad(50); 
    peixe.barbatana1.position.z = 6;
    peixe.barbatana1.rotation.z = -(Math.PI/2);
    peixe.add(peixe.barbatana1);

    // Barbatana lateral 2
    peixe.barbatana2 = peixe.barbatana1.clone();
    peixe.barbatana2.rotation.y = (Math.PI); 
    peixe.barbatana2.rotation.y = THREE.MathUtils.degToRad(130); 
    peixe.barbatana2.position.z = -6;
    peixe.barbatana2.rotation.z = (Math.PI/2);
    peixe.add(peixe.barbatana2);

    // Cabeça
    const peixeCabeca = new THREE.Mesh(
        new THREE.ConeGeometry( 7.1, 10, 4 ),
        new THREE.MeshLambertMaterial( {color: 0xffff00} )
    );
    peixeCabeca.position.x = 15;
    peixeCabeca.rotation.x = -(Math.PI / 4);
    peixeCabeca.rotation.z = -(Math.PI / 2);
    peixe.add(peixeCabeca);

    // Olho 1
    const peixeOlho1 = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.5, .1),
        new THREE.MeshLambertMaterial({ color: 0x00000 })
    );
    peixeOlho1.position.x = 12;
    peixeOlho1.position.y = 2;
    peixeOlho1.position.z = 4;
    peixe.add(peixeOlho1);

    // Olho 2
    const peixeOlho2 = peixeOlho1.clone();
    peixeOlho2.position.x = 12;
    peixeOlho2.position.y = 2;
    peixeOlho2.position.z = -4;
    peixe.add(peixeOlho2);

    // Objeto peixe
    peixe.position.y = -40;
    peixe.scale.set(.4,.4,.4);
    scene.add(peixe);

    // Hitbox do peixe
    if (hitboxPeixe) {
        peixe.hitbox = new THREE.Mesh(
            new THREE.SphereGeometry(7, 32, 16),
            new THREE.MeshPhongMaterial({ color: 0xB5927C, transparent: true, opacity: .35 })
        );
        peixe.hitbox.position.x = peixe.position.x;
        peixe.hitbox.position.y = peixe.position.y;
        scene.add(peixe.hitbox)
    }
}

function criarHomem() {
    //Tronco Homem
    homem = new THREE.Group();
    const geometryCorpoHomem = new THREE.CylinderGeometry( 3, 4, 8, 5, 4 );
    const materialCorpoHomem = new THREE.MeshLambertMaterial({
        color: "yellow"
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
        color: "yellow"
    });

    const homemBracoE = new THREE.Mesh(geometryBracoEHomem, materialBracoEHomem);
    homemBracoE.position.x = 3;
    homemBracoE.position.y = 0;
    homemBracoE.position.z = -3;
    bracos.add(homemBracoE);

    //Mão Esquerda
    const geometryMaoEHomem = new THREE.SphereGeometry(0.7);
    const materialMaoEHomem = new THREE.MeshLambertMaterial({
        color: "pink"
    });

    const homemMaoE = new THREE.Mesh(geometryMaoEHomem, materialMaoEHomem);
    homemMaoE.position.x = 4.5;
    homemMaoE.position.y = -2.8;
    homemMaoE.position.z = 1;
    homemBracoE.add(homemMaoE);

    //Braço Direita
    const geometryBracoDHomem = new THREE.CylinderGeometry(1, 0.7 , 10);
    geometryBracoDHomem.rotateX(0.2)
    geometryBracoDHomem.rotateZ(1)
    const materialBracoDHomem = new THREE.MeshLambertMaterial({
        color: "yellow"
    });

    homemBracoD = new THREE.Mesh(geometryBracoDHomem, materialBracoDHomem);
    homemBracoD.position.x = 3;
    homemBracoD.position.y = 0;
    homemBracoD.position.z = 3;
    bracos.add(homemBracoD);

    //Mão Direita
    const geometryMaoDHomem = geometryMaoEHomem.clone();
    const materialMaoDHomem = new THREE.MeshLambertMaterial({
        color: "pink"
    });

    const homemMaoD = new THREE.Mesh(geometryMaoDHomem, materialMaoDHomem);
    homemMaoD.position.x = 4.5;
    homemMaoD.position.y = -2.8;
    homemMaoD.position.z = -1;
    homemBracoD.add(homemMaoD);

    //Perna Esquerda 1
    const geometryPernaEHomem1 = new THREE.BoxGeometry(9, 2.4, 2.4);
    const materialPernaEHomem1 = new THREE.MeshLambertMaterial({
        color: "black"
    });

    const homemPernaE1 = new THREE.Mesh(geometryPernaEHomem1, materialPernaEHomem1);
    homemPernaE1.position.x = 1.5;
    homemPernaE1.position.y = -5.2;
    homemPernaE1.position.z = -2;
    homem.add(homemPernaE1);

    //Perna Direita 1
    const geometryPernaDHomem1 = geometryPernaEHomem1.clone();
    const materialPernaDHomem1 = new THREE.MeshLambertMaterial({
        color: "black"
    });

    const homemPernaD1 = new THREE.Mesh(geometryPernaDHomem1, materialPernaDHomem1);
    homemPernaD1.position.x = 1.5;
    homemPernaD1.position.y = -5.2;
    homemPernaD1.position.z = 2;
    homem.add(homemPernaD1);

    //Perna Esquerda 2
    const geometryPernaEHomem2 = new THREE.BoxGeometry(3, 2.4, 2.4);
    const materialPernaEHomem2 = new THREE.MeshLambertMaterial({
        color: "black"
    });

    const homemPernaE2 = new THREE.Mesh(geometryPernaEHomem2, materialPernaEHomem2);
    homemPernaE2.position.x = 4.5;
    homemPernaE2.position.y = -7.7;
    homemPernaE2.position.z = -2;
    homem.add(homemPernaE2);

    //Perna Direita 2
    const geometryPernaDHomem2 = geometryPernaEHomem2.clone();
    const materialPernaDHomem2 = new THREE.MeshLambertMaterial({
        color: "black"
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
        color: "brown",
    });
    const homemCabelo2 = new THREE.Mesh(geometryCabeloHomem2, materialCabeloHomem2);
    homemCabelo2.position.x = 1;
    homemCabelo2.position.y = 9.5;
    // homemCabelo1.rotation.y = -0.30 
    cabelo.add(homemCabelo2);

    //Cabelo3
    const geometryCabeloHomem3 = geometryCabeloHomem1.clone();
    const materialCabeloHomem3 = new THREE.MeshLambertMaterial({
        color: "brown",
    });
    const homemCabelo3 = new THREE.Mesh(geometryCabeloHomem3, materialCabeloHomem3);
    homemCabelo3.position.x = 0.5;
    homemCabelo3.position.y = 9.7;
    // homemCabelo1.rotation.y = -0.30 
    cabelo.add(homemCabelo3);

    //Cabelo4
    const geometryCabeloHomem4 = geometryCabeloHomem1.clone();
    const materialCabeloHomem4 = new THREE.MeshLambertMaterial({
        color: "brown",
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
    cabelo.add(homemCabelo6);

    //Cabelo7
    const geometryCabeloHomem7 = geometryCabeloHomem1.clone();
    const materialCabeloHomem7 = new THREE.MeshLambertMaterial({
        color: "brown"
    });
    const homemCabelo7 = new THREE.Mesh(geometryCabeloHomem7, materialCabeloHomem7);
    homemCabelo7.position.x = -1.5;
    homemCabelo7.position.y = 9;
    cabelo.add(homemCabelo7);


    //olho direita
    const geometryOlhoDHomem = new THREE.SphereGeometry(0.1);
    const materialOlhoDHomem = new THREE.MeshLambertMaterial({
        color: "green"
    });
    const homemOlhoD = new THREE.Mesh(geometryOlhoDHomem, materialOlhoDHomem);
    homemOlhoD.position.x = 2.2;
    homemOlhoD.position.y = 7.5;
    homemOlhoD.position.z = 1;
    homem.add(homemOlhoD);

    //olho direitaBranco
    const geometryOlhoDBHomem = new THREE.SphereGeometry(0.3);
    const materialOlhoDBHomem = new THREE.MeshLambertMaterial({
        color: "White"
    });
    const homemOlhoDB = new THREE.Mesh(geometryOlhoDBHomem, materialOlhoDBHomem);
    homemOlhoDB.position.x = 1.92;
    homemOlhoDB.position.y = 7.5;
    homemOlhoDB.position.z = 1;
    homem.add(homemOlhoDB);

    //olho esquerda
    const geometryOlhoEHomem = geometryOlhoDHomem.clone()
    const materialOlhoEHomem = new THREE.MeshLambertMaterial({
        color: "green"
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
        color: "black"
    });
    const homemNariz = new THREE.Mesh(geometryNarizHomem, materialNarizHomem);
    homemNariz.position.x = 2.3;
    homemNariz.position.y = 6.7;
    homem.add(homemNariz);

    //boca
    barba = new THREE.Group();
    const geometryBocaHomem = new THREE.BoxGeometry(0.5, 0.5, 2);
    const materialBocaHomem = new THREE.MeshLambertMaterial({
        color: "brown"
    });
    const homemBoca = new THREE.Mesh(geometryBocaHomem, materialBocaHomem);
    homemBoca.position.x = 1.92;
    homemBoca.position.y = 5;
    barba.add(homemBoca);

    //bocabaixo
    const geometryBocaDupHomem = new THREE.BoxGeometry(0.5, 0.5, 2);
    const materialBocaDupHomem = new THREE.MeshLambertMaterial({
        color: "brown"
    });
    const homemBocaDup = new THREE.Mesh(geometryBocaDupHomem, materialBocaDupHomem);
    homemBocaDup.position.x = 1.92;
    homemBocaDup.position.y = 4.5;
    barba.add(homemBocaDup);

    //bocabaixo2
    const geometryBocaDupHomem2 = new THREE.BoxGeometry(0.5, 0.5, 1);
    const materialBocaDupHomem2 = new THREE.MeshLambertMaterial({
        color: "brown"
    });
    const homemBocaDup2 = new THREE.Mesh(geometryBocaDupHomem2, materialBocaDupHomem2);
    homemBocaDup2.position.x = 2.2;
    homemBocaDup2.position.y = 4;
    barba.add(homemBocaDup2);

    //Boca 2
    const geometryBocaHomem2 = new THREE.BoxGeometry(0.5, 1, 0.5);
    const materialBocaHomem2 = new THREE.MeshLambertMaterial({
        color: "brown"
    });
    const homemBoca2 = new THREE.Mesh(geometryBocaHomem2, materialBocaHomem2);
    homemBoca2.position.x = 1.92;
    homemBoca2.position.y = 5.3;
    homemBoca2.position.z = -1;
    barba.add(homemBoca2);

    //boca 3
    const geometryBocaHomem3 = new THREE.BoxGeometry(0.5, 1, 0.5);
    const materialBocaHomem3 = new THREE.MeshLambertMaterial({
        color: "brown"
    });
    const homemBoca3 = new THREE.Mesh(geometryBocaHomem3, materialBocaHomem3);
    homemBoca3.position.x = 1.92;
    homemBoca3.position.y = 5.3;
    homemBoca3.position.z = 1;
    barba.add(homemBoca3);

    //lingua
    const geometryLinguaHomem = new THREE.BoxGeometry(0.3, 0.1, 1.5);
    const materialLinguaHomem3 = new THREE.MeshLambertMaterial({
        color: "white"
    });
    const homemLingua = new THREE.Mesh(geometryLinguaHomem, materialLinguaHomem3);
    homemLingua.position.x = 2.1;
    homemLingua.position.y = 5.3;
    homem.add(homemLingua);

    //Objeto homem
    homem.add(barba)
    homem.add(cabelo);
    homem.add(bracos);
    homem.position.y = 13;
    homem.position.x = 5;
    barco.add(homem);
}

function criarCeu() {
    // Céu e sol (https://threejs.org/examples/webgl_shaders_sky.html)
    ceu = new Sky();
    ceu.scale.setScalar(15000);
    scene.add(ceu);

    sol = new THREE.Vector3();

    ceu.material.uniforms['turbidity'].value =.0;
    ceu.material.uniforms['rayleigh'].value = .5;
    ceu.material.uniforms['mieCoefficient'].value = 0.005;
    ceu.material.uniforms['mieDirectionalG'].value = .7;
    sol.setFromSphericalCoords(1, THREE.MathUtils.degToRad(84), THREE.MathUtils.degToRad(180));
    ceu.material.uniforms['sunPosition'].value.copy(sol);
}

function criarAgua() {
    // Fundo do oceano
    const geoFundoOceano = new THREE.PlaneGeometry(500, 150);
    const matFundoOceano = new THREE.MeshPhongMaterial({
        transparent: true,
        opacity: 1,
        color: 0x4771A8,
        side: THREE.DoubleSide
    });
    const meshFundoOceano = new THREE.Mesh(geoFundoOceano, matFundoOceano);
    meshFundoOceano.position.z = -25;
    meshFundoOceano.position.y = -76;
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

    const matAgua = new THREE.MeshLambertMaterial({color: 0x26578c});
    const meshAgua = new THREE.Mesh(geoAgua, matAgua);
    meshAgua.position.z = -25;
    scene.add(meshAgua);
}

function criarCana() {
    // Cana - pivot
    cana = new THREE.Group();
    cana.position.x = -19;
    cana.position.y = 11;
    scene.add(cana)

    // Corpo da cana
    const corpoCana = new THREE.Mesh(
        new THREE.CylinderGeometry(.3, .3, 40, 32),
        new THREE.MeshPhongMaterial({ color: 0x000000 })
    );
    corpoCana.rotation.z = -(Math.PI / 4);
    corpoCana.position.x = 38;
    cana.add(corpoCana);

    ancora = new THREE.Object3D();
    ancora.position.x = 52;
    ancora.position.y = 13.5;

    // Corda da cana
    geoCorda = new THREE.CylinderGeometry(.05, .05, initVal, 32);
    matCorda = new THREE.MeshPhongMaterial({ color: 0x26AFB7 });
    corda = new THREE.Mesh(geoCorda, matCorda);
    corda.position.y = -25;

    // Carreto da cana
    const carretoCana = new THREE.Mesh(
        new THREE.CylinderGeometry(.75, .75, 3, 32),
        new THREE.MeshPhongMaterial({ color: 0xBDBDBD })
    );
    carretoCana.rotation.z = -(Math.PI / 4);
    carretoCana.position.x = 26;
    carretoCana.position.y = -13;
    cana.add(carretoCana);

    // Isco da cana
    isco = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 16),
        new THREE.MeshPhongMaterial({ color: 0xB5927C })
    );
    isco.position.y = -25;
    isco.posx = 38;
    isco.posy = -12.5
    corda.add(isco);

    ancora.add(corda);
    cana.add(ancora);
    homem.add(cana);
}

function animacaoCana() {
    // Animação do barco
    if (isDangling) {
        // O barco está a flutuar para a esquerda
        // Verificar se já atingiu o ponto máximo de flutuação
        ancora.rotation.z -= 0.0008;

        if (ancora.rotation.z <= -0.03) {
            isDangling = false;
        }
    } else {
        ancora.rotation.z += 0.001;
        if (ancora.rotation.z >= 0.03) {
            isDangling = true;
        }
    }
}

function animacaoBarco() {
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
}

function animacaoMar() {
    // Animação da onda a cada render executado
    verticesOnda.forEach((vd, idx) => {
        geoAgua.attributes.position.setY(idx, (vd.initH + Math.sin(clock.getElapsedTime() + vd.phase) * vd.amplitude));
    });
    geoAgua.attributes.position.needsUpdate = true;
    geoAgua.computeVertexNormals();
}

function animacaoPeixe() {
    // Animação do peixe
    if (shouldBeAnimated) {
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
    }

    // Mover a hitbox do peixe (se a mesma estiver ativa)
    if (hitboxPeixe) {
        peixe.hitbox.position.x = peixe.position.x;
        peixe.hitbox.position.y = peixe.position.y;
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
}

function animacaoHomem() {
    // Aminação do cabelo
    if (isMovingLeft) {
        // O cabelo esta-se mecher para a esquerda
        // Verifica se já atingiu o ponto máximo de oscilação
        cabelo.rotation.z -= 0.0009;
        if (cabelo.rotation.z <= -0.03) {
            isMovingLeft = false;
        }
    } else {
        cabelo.rotation.z += 0.0009;
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
}

function mapearControlos() {
    // Lidar com os controlos
    if (keys["ArrowUp"]) {
        aumentarCorda(-1)
    }

    if (keys["ArrowDown"]) {
        aumentarCorda(1)
    }

    if (keys["a"]) {
        if (barco.position.x > -(window.innerWidth * .04)) {
            if (acel > -0.3) {
                acel -= 0.002;
            }
            isco.posx += acel;
            barco.position.x += acel;
        }
        motor.rotation.x += 0.2;
    }

    if (keys["d"]) {
        if (barco.position.x < (window.innerWidth * .04)) {
            if (acel < 0.3) {
                acel += 0.002;
            }
            isco.posx += acel;
            barco.position.x += acel;
        }
        motor.rotation.x -= 0.2;
    }

    if((!keys["a"]) && (parseFloat(acel).toFixed(2) != 0.00) && (!keys["d"])) {
        acel = acel < 0 ? acel += 0.002 : acel -= 0.002;
        barco.position.x += acel;
        isco.posx += acel;
    }
}

window.addEventListener("resize", function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
});

window.addEventListener("keydown", event => {
    keys[event.key] = true;
    // Como o jogo está em modo fullscreen e necessitamos de obter o input para o nome do utilizador
    // o preventDefault não faz diferença nenhuma
    // event.preventDefault();
});

window.addEventListener("keyup", event => {
    keys[event.key] = false;
});