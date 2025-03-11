// Ethers.js için gerekli polyfill'ler
// Bu dosya, ethers.js'in tarayıcıda çalışması için gerekli global değişkenleri tanımlar

// Node.js global değişkenlerini tarayıcı ortamına ekle
import { Buffer } from 'buffer';
import process from 'process';

// Global değişkenleri tanımla
window.Buffer = Buffer;
window.process = process;
window.global = window as any; 