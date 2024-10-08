
import {
    f_add_css,
    f_s_css_prefixed,
    o_variables, 
    f_s_css_from_o_variables
} from "https://deno.land/x/f_add_css@1.1/mod.js"

import {
    f_o_html__and_make_renderable,
}from 'https://deno.land/x/f_o_html_from_o_js@4.0.3/mod.js'

let o_mod_notifire = await import('https://deno.land/x/f_o_html_from_o_js@4.0.3/localhost/jsh_modules/notifire/mod.js');

import {
    f_o_webgl_program,
    f_delete_o_webgl_program,
    f_resize_canvas_from_o_webgl_program,
    f_render_from_o_webgl_program
} from "https://deno.land/x/handyhelpers@4.0.7/mod.js"

import {
    f_s_hms__from_n_ts_ms_utc,
} from "https://deno.land/x/date_functions@1.4/mod.js"

let a_o_shader = []
let n_idx_a_o_shader = 0;



let o_state = {
    b_playing: false,
    o_audio_buffer: null,
    o_webgl_program: null,
    o_audio_context: new (window.AudioContext || window.webkitAudioContext)(),
    o_el_img: null,
    o_audio: null,
    o_shader: {},
    o_state_notifire: {},
    n_idx_a_o_shader,
    a_o_shader,
    a_n_f32_audio_data_channel0: new Float32Array(),
}

window.o_state = o_state
o_variables.n_rem_font_size_base = 1. // adjust font size, other variables can also be adapted before adding the css to the dom
o_variables.n_rem_padding_interactive_elements = 0.5; // adjust padding for interactive elements 
f_add_css(
    `
    body{
        min-height: 100vh;
        min-width: 100vw;
        /* background: rgba(0,0,0,0.84);*/
        display:flex;
        justify-content:center;
        align-items:flex-start;
    }
    canvas{
        width: 100%;
        height: 100%;
        position:fixed;
        z-index:-1;
    }
    #o_el_time{
        margin:1rem;
        background: rgba(0, 0, 0, 0.4);
        padding: 1rem;
    }
    ${
        f_s_css_from_o_variables(
            o_variables
        )
    }
    `
);






// it is our job to create or get the cavas
let o_canvas = document.createElement('canvas'); // or document.querySelector("#my_canvas");
document.body.appendChild(o_canvas);



let f_update_shader = function(){

    if(o_state.o_webgl_program){
        f_delete_o_webgl_program(o_state.o_webgl_program)
    }
    o_state.o_webgl_program = f_o_webgl_program(
        o_canvas,
        `#version 300 es
        in vec4 a_o_vec_position_vertex;
        void main() {
            gl_Position = a_o_vec_position_vertex;
        }`, 
        `#version 300 es
        precision mediump float;
        in vec2 o_trn_nor_pixel;
        out vec4 fragColor;
        uniform vec4 iMouse;
        uniform float iTime;
        uniform vec2 iResolution;
        uniform vec4 iDate;
        uniform float n_cursor_nor;
    
        uniform sampler2D o_audio_texture_channel0;  // Waveform data passed as a texture
        uniform vec2 o_scl_audio_texture_channel0;

        void main() {
            float n_scl_min = min(iResolution.x, iResolution.y);
            float n_scl_max = max(iResolution.x, iResolution.y);
            vec2 o_trn = (gl_FragCoord.xy-iResolution.xy*.5)/n_scl_min;
            vec2 o_trn2 = gl_FragCoord.xy/iResolution.xy;
            float n_idx_max = o_scl_audio_texture_channel0.x*o_scl_audio_texture_channel0.y;
            float n_idx2 = o_trn2.x*n_idx_max;
            float n_trn_x_texture = mod(n_idx2, o_scl_audio_texture_channel0.x);
            float n_trn_y_texture = floor(n_idx2 / o_scl_audio_texture_channel0.x);

            // Get the normalized pixel coordinates (0 to 1 for X and Y)
            float x = gl_FragCoord.x / iResolution.x;
            float y = gl_FragCoord.y / iResolution.y;
            vec4 o_pixel = texelFetch(o_audio_texture_channel0, ivec2(n_trn_x_texture, n_trn_y_texture), 0);
            // vec4 o_pixel = texture(o_audio_texture_channel0, o_trn);
            // vec4 o_pixel = texture(o_audio_texture_channel0, o_trn2);
            float n_amp2 = 0.1;
            float n_range_amp = o_pixel.r*n_amp2; 
            float n_y = (abs(o_trn.y) - n_range_amp);
            n_y = step(0.01, n_y);
            vec3 o_col2 = vec3(1.);
            float n_diff_x = abs(o_trn2.x - n_cursor_nor);
            float n_x_line = smoothstep((1./n_scl_min),0., n_diff_x);
            fragColor = vec4(
                (1.-n_y) *vec3(1.) - n_x_line + (n_x_line)*vec3(1., 0., 0.),
                1.
            );
            fragColor = clamp(vec4(0.),vec4(1.), fragColor);
            fragColor +=  (n_x_line)*vec4(1., 0., 0.,1.);
        }
        `
    )
    
    o_state.o_ufloc__iResolution = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'iResolution');
    o_state.o_ufloc__iDate = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'iDate');
    o_state.o_ufloc__iMouse = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'iMouse');
    o_state.o_ufloc__iTime = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'iTime');
    o_state.o_ufloc__n_cursor_nor = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'n_cursor_nor');

    let gl = o_state.o_webgl_program.o_ctx;
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    let n_scl_x = 1920;
    let n_scl_y = 1;
    let a_n_u8_audio_data_new = new Uint8Array(n_scl_y*n_scl_x);
    // we take at max n_scl_x*n_scl_y samples and put them into a 2d textrue.

    o_state.o_ufloc__o_scl_audio_texture_channel0 = o_state.o_webgl_program?.o_ctx.getUniformLocation(o_state.o_webgl_program?.o_shader__program, 'o_scl_audio_texture_channel0');

    o_state.o_webgl_program?.o_ctx.uniform2f(o_state.o_ufloc__o_scl_audio_texture_channel0,
        n_scl_x, 
        n_scl_y
    );
    

    let n_f32_sum = 0.;
    let n_f32_count = 0.;
    let n_idx_a_n_u8_audio_data_new = 0;
    let n_samples_per_subsample = o_state.a_n_f32_audio_data_channel0.length / a_n_u8_audio_data_new.length;
    let n_samples_per_subsample_floor = Math.floor(n_samples_per_subsample);
    // original length 10443406
    // new array length 1920*1080 = 
    // samples per new sample = 10443406÷(1920×1080) = 5.036364776
    let n_f32_range = 0.;
    let n_f32_min = 0.;
    let n_f32_max = 0.;
    for(let n = 0; n < a_n_u8_audio_data_new.length; n+=1){


        let n_nor = n / a_n_u8_audio_data_new.length;
        const n_idx_start = Math.floor(n * n_samples_per_subsample);
        const n_idx_end = Math.floor((n + 1) * n_samples_per_subsample);
        n_f32_sum = 0.;
        n_f32_count = 0.;

        n_f32_min = 1.;
        n_f32_max = -1.;
        for(let n_idx2 = n_idx_start;n_idx2 <n_idx_end;n_idx2+=1){
            let n_f32 = o_state.a_n_f32_audio_data_channel0[n_idx2];
            n_f32_sum += n_f32;
            n_f32_count += 1.;
            n_f32_min = Math.min(n_f32_min, n_f32);
            n_f32_max = Math.max(n_f32_max, n_f32);
        }
        n_f32_range = n_f32_max-n_f32_min;
        let n_f32_avg = n_f32_sum / n_f32_count;
        let n_f32 = o_state.a_n_f32_audio_data_channel0[n_idx_start];
        // n_f32 = n_f32_avg;
        let n_u8 = Math.floor((n_f32 + 1) * 127.5);
        n_u8 = parseInt((n_f32_range/2.)*255);
        a_n_u8_audio_data_new[n] = n_u8;


    }


    console.log(a_n_u8_audio_data_new)

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, n_scl_x, n_scl_y, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, a_n_u8_audio_data_new);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    o_state.o_ufloc__o_audio_texture_channel0 = o_state.o_webgl_program.o_ctx.getUniformLocation(o_state.o_webgl_program.o_shader__program, 'o_audio_texture_channel0');
    o_state.o_webgl_program.o_ctx.uniform1i(o_state.o_ufloc__o_audio_texture_channel0, 0);  // 0 corresponds to TEXTURE0

    f_resize()
}

// just for the demo 
// o_canvas.style.position = 'fixed';
// o_canvas.style.width = '100vw';
// o_canvas.style.height = '100vh';
let f_resize = function(){
    if(o_state.o_webgl_program){
        // this will resize the canvas and also update 'o_scl_canvas'
        f_resize_canvas_from_o_webgl_program(
            o_state.o_webgl_program,
            window.innerWidth, 
            window.innerHeight
        )
    
        o_state.o_webgl_program?.o_ctx.uniform2f(o_state.o_ufloc__iResolution,
            window.innerWidth, 
            window.innerHeight
        );
    
        f_render_from_o_webgl_program(o_state.o_webgl_program);
    }
}

window.addEventListener('resize', ()=>{
    f_resize();
});

let n_id_raf = 0;


let mouseX = 0;
let mouseY = 0;
let clickX = 0;
let clickY = 0;
let isMouseDown = false;

// Event listener for mouse move
o_canvas.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

// Event listener for mouse down
o_canvas.addEventListener('mousedown', (event) => {
    isMouseDown = true;
    clickX = event.clientX;
    clickY = event.clientY;
});

// Event listener for mouse up
o_canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
});

let o_el_time = document.createElement('div');
o_el_time.id = 'o_el_time'
document.body.appendChild(o_el_time);

let n_ms_update_time_last = 0;
let n_ms_update_time_delta_max = 1000;
let f_raf = function(){
    if(o_state.o_webgl_program){
        let o_date = new Date();
        let n_sec_of_the_day_because_utc_timestamp_does_not_fit_into_f32_value = (o_date.getTime()/1000.)%(60*60*24)
        // n_sec_of_the_day_because_utc_timestamp_does_not_fit_into_f32_value = (60*60*24)-1 //test
        o_state.o_webgl_program?.o_ctx.uniform4f(o_state.o_ufloc__iDate,
            o_date.getUTCFullYear(),
            o_date.getUTCMonth(), 
            o_date.getUTCDate(),
            n_sec_of_the_day_because_utc_timestamp_does_not_fit_into_f32_value
        );
        o_state.o_webgl_program?.o_ctx.uniform4f(o_state.o_ufloc__i_mouse,
            isMouseDown ? mouseX : 0.0,
            isMouseDown ? mouseY : 0.0,
            clickX,
            clickY
        );
        o_state.o_webgl_program?.o_ctx.uniform1f( o_state.o_ufloc__iTime,
            n_sec_of_the_day_because_utc_timestamp_does_not_fit_into_f32_value
        );
        if(o_state?.o_audio_buffer?.duration){
            let n = o_state.o_audio_context.currentTime / o_state.o_audio_buffer?.duration;
            // console.log(n);
            o_state.o_webgl_program?.o_ctx.uniform1f( o_state.o_ufloc__n_cursor_nor,
                n
            );
        }
       
       
        let s_time = `${f_s_hms__from_n_ts_ms_utc(o_date.getTime(), 'UTC')}.${((o_date.getTime()/1000)%1).toFixed(3).split('.').pop()}`
        o_el_time.innerText = `UTC: ${s_time}`
    
        let n_ms = window.performance.now()
        let n_ms_delta = Math.abs(n_ms_update_time_last - n_ms);
        if(n_ms_delta > n_ms_update_time_delta_max){
            document.title = `${s_time.split('.').shift()} Shader-Clock` 
            n_ms_update_time_last = n_ms;
        }
        f_render_from_o_webgl_program(o_state.o_webgl_program);
    }

    n_id_raf = requestAnimationFrame(f_raf)

}
n_id_raf = requestAnimationFrame(f_raf)


let n_id_timeout = 0;
window.onpointermove = function(){
    clearTimeout(n_id_timeout);
    o_el_time.style.display = 'block'
    n_id_timeout = setTimeout(()=>{
        o_el_time.style.display = 'none'
    },5000)
}
window.onpointerdown = function(){
    o_state.n_idx_a_o_shader = (o_state.n_idx_a_o_shader+1)% o_state.a_o_shader.length;
    o_state.o_shader = o_state.a_o_shader[o_state.n_idx_a_o_shader]
    f_update_shader();
}
f_update_shader()


// Determine the current domain
const s_hostname = window.location.hostname;

// Create the WebSocket URL, assuming ws for http and wss for https
const s_protocol_ws = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const s_url_ws = `${s_protocol_ws}//${s_hostname}:${window.location.port}`;

// Create a new WebSocket instance
const o_ws = new WebSocket(s_url_ws);

// Set up event listeners for your WebSocket
o_ws.onopen = function(o_e) {
    console.log({
        o_e, 
        s: 'o_ws.onopen called'
    })
};

o_ws.onerror = function(o_e) {
    console.log({
        o_e, 
        s: 'o_ws.onerror called'
    })
};

o_ws.onmessage = function(o_e) {
    console.log({
        o_e, 
        s: 'o_ws.onmessage called'
    })
    o_state.a_o_msg.push(o_e.data);
    o_state?.o_js__a_o_mod?._f_render();

};
window.addEventListener('pointerdown', (o_e)=>{
    o_ws.send('pointerdown on client')
})



document.body.appendChild(
    await f_o_html__and_make_renderable(
        {
            style: "max-height: 30vh; overflow-y:scroll",
            a_o: [
                {
                    f_after_f_o_html__and_make_renderable:(o)=>{
                        o_state.o_el_img = o
                    },
                    f_o_jsh:()=>{
                        return {
                            s_tag: "img", 
                        }
                    }
                },
                {
                    s_tag: "input", 
                    type: "file",
                    oninput: async (o_e)=>{
                        const file = o_e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                    
                            reader.onload = function(e) {
                                const arrayBuffer = e.target.result;
                                const fileUrl = URL.createObjectURL(file);
                                

                                o_state.o_audio_context.decodeAudioData(arrayBuffer, function(o_audiobuffer) {
                                    o_state.o_audio_buffer = o_audiobuffer
                                    const channelData = o_audiobuffer.getChannelData(0);  // Get PCM data for channel 0
                            
                                    // Now pass this PCM data to WebGL (see next steps)
                                    console.log('PCM data:', channelData);
                                    let waveformArray = new Float32Array(channelData.length);
                                    waveformArray.set(channelData);
                                    console.log(waveformArray)
                                    o_state.a_n_f32_audio_data_channel0 = waveformArray;
                                    f_update_shader();

                                    // Create an audio source
                                    let audioSource = o_state.o_audio_context.createBufferSource();
                                    audioSource.buffer = o_audiobuffer;

                                    // Connect the audio source to the context's destination (i.e., the speakers)
                                    audioSource.connect(o_state.o_audio_context .destination);

                                    o_state.o_audio_source = audioSource
                                    // Start the audio playback
                                    // audioSource.start();
                                    window.addEventListener('click',async ()=>{
                                        let s_function = (!o_state.b_playing) ? 'start' :'stop';
                                        await o_state.o_audio_source[s_function]();
                                        o_state.b_playing = !o_state.b_playing;
                                    })


                                });
                            };
                    
                            reader.readAsArrayBuffer(file);  // Read the file as an ArrayBuffer
                        }
                            

                    }
                },
                {
                    innerText: "Hello",
                },
                o_mod_notifire.f_o_js(
                    o_state.o_state_notifire
                ),
                
            ]
        }
    )
)
o_mod_notifire.f_o_throw_notification(o_state.o_state_notifire,'hello!')
