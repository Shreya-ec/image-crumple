import "./style.css";
import * as THREE from "three";
import vertex from "./shaders/vertex.glsl";
import fragment from "./shaders/fragment.glsl";
import gsap from "gsap";

class Site {
  constructor({ dom }) {
    this.time = 0;
    this.container = dom;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.images = [...document.querySelectorAll(".images img")];
    this.material;
    this.imageStore = [];
    this.uStartIndex = 0;
    this.uEndIndex = 1;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 100, 2000);

    this.camera.position.z = 200;
    this.camera.fov = 2 * Math.atan(this.height / 2 / 200) * (180 / Math.PI);   //field of view- your object's distance from screen

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,  //no jaggered edges, smooth edges
      alpha: true,    //renderer won't hold black color, will be on image otherwise transparent
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this.renderer.render(this.scene, this.camera);

    this.addImages();
    this.resize();
    this.setupResize();
    this.setPosition();
    this.hoverOverLinks();
    this.render();
  }

  resize(){
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.setPosition();
  }

  setupResize(){
    window.addEventListener("resize", this.resize.bind(this));
  }

  //to set images in correct positions
  setPosition() {
    this.imageStore.forEach((img) => {
      const bounds = img.img.getBoundingClientRect();
      img.mesh.position.y = -bounds.top + this.height / 1.5 - bounds.height / 2;   //three js -> I quad (+y-axis is upside), web -> IV quad (+y-axis is downside)
      img.mesh.position.x = bounds.left - this.width / 2 + bounds.width / 2;
    });
  }

  addImages() {
    //images ki copy banai - paper vali
    const textureLoader = new THREE.TextureLoader();
    const textures = this.images.map((img) => textureLoader.load(img.src));

    const uniforms = {
      uTime: { value: 0 },
      uTimeline: { value: 0.2 },
      uStartIndex: { value: 0},
      uEndIndex: { value: 1 },
      uImage1: {value: textures[0] },
      uImage2: {value: textures[1] },
      uImage3: {value: textures[2] },
      uImage4: {value: textures[3] },
    };

    //paper banaya
    this.material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertex,     //vertex shader: used to create geometry point wise, shake/zoom the geometry
      fragmentShader: fragment,      //fragment shader: used to print
      transparent: true,
    })

    //paper per image ki copy atatch kari
    this.images.forEach((img) => {
      const bounds = img.getBoundingClientRect();
      const geometry = new THREE.PlaneGeometry(bounds.width, bounds.height);    //paper size = image size
      const mesh = new THREE.Mesh(geometry, this.material);  //prints img on paper

      // scene me add krdiya
      this.scene.add(mesh);

      this.imageStore.push({
        img: img,
        mesh: mesh,
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height
      })
    })
  }

  hoverOverLinks(){
    const links = document.querySelectorAll(".links a");
    links.forEach((links, i) => {
      links.addEventListener("mouseover", (e) => {
        this.material.uniforms.uTimeline.value = 0.0;

        gsap.to(this.material.uniforms.uTimeline, {
          value: 3.0,
          duration: 1,
          onStart: () => {
            this.uEndIndex = i;
            this.material.uniforms.uStartIndex.value = this.uStartIndex;
            this.material.uniforms.uEndIndex.value = this.uEndIndex;
            this.uStartIndex = this.uEndIndex;
          }
        });
      } )
    })
  }

  render() {
    this.time += 0.1;
    this.material.uniforms.uTime.value = this.time;
    this.renderer.render(this.scene, this.camera);  //recursively running irl time
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Site({
  dom: document.querySelector(".canvas"),
});