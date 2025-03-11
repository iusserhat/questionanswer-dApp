# Soru & Cevap dApp

Bu proje, Ethereum blok zinciri üzerinde çalışan bir Soru & Cevap platformudur. Kullanıcılar sorular sorabilir, cevaplar verebilir ve beğendikleri cevapları SRT token kullanarak oylayabilirler.

## Özellikler

- MetaMask cüzdan entegrasyonu
- Soru sorma
- Soruları cevaplama
- Cevapları SRT token ile oylama (10 SRT token gerektirir)
- Tüm soruları ve cevapları görüntüleme
- Token bakiyesi görüntüleme

## Teknolojiler

- React
- TypeScript
- Ethers.js
- MetaMask
- Vite

## Kurulum

1. Projeyi klonlayın:
```bash
git clone <repo-url>
cd frontend/my-app
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

4. Tarayıcınızda `http://localhost:5173` adresine gidin.

## Kullanım

1. MetaMask cüzdanınızı bağlayın.
2. SRT token bakiyenizi kontrol edin.
3. Yeni bir soru sormak için "Yeni Soru Sor" bölümünü kullanın.
4. Mevcut soruları görmek ve cevaplamak için "Sorular" bölümünü kullanın.
5. Beğendiğiniz cevapları oylamak için "Oyla" düğmesini kullanın (10 SRT token gerektirir).

## Akıllı Kontratlar

Bu dApp iki akıllı kontrat kullanır:

1. **SRTToken**: ERC20 token kontratı
2. **QuestionAnswer**: Soru-cevap işlevselliğini yöneten kontrat

Kontrat adresleri:
- SRTToken: 0xF4cfBc57E554192090F6829c8BF9fC180835C995
- QuestionAnswer: 0xa4f84944d9d323A78325703e354E7329B032147a

## Kontrat Özellikleri

### QuestionAnswer Kontratı

- Kullanıcılar soru oluşturabilir
- Kullanıcılar soruları cevaplayabilir
- Kullanıcılar cevapları SRT token ile oylayabilir
- Her oylama 10 SRT token gerektirir
- Oylama ücretinin %80'i cevap yazarına gider, %20'si kontrat içinde kalır

## Lisans

MIT
