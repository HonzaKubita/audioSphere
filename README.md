# Audio Sphere

Audio Sphere is a website that is made to visualize music you upload to it.

The sound is visualized by moving small spheres that are arranged in a way they make a bigger sphere and then moving those small spheres.

It works by doing FFT (Fast Fourier Transform) on the sound live as it is playing, I take the output of FFT and move each small sphere by the value of equivalent element of the FFT output.

The code is hosted on [Netflify - Audiosphere](https://audiosphere.netlify.app/)
