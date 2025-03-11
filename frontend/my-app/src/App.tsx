import { useState, useEffect } from 'react'
import * as ethers from 'ethers'
import detectEthereumProvider from '@metamask/detect-provider'
import './App.css'
// @ts-ignore
import { SRTTOKEN_ADDRESS, QUESTIONANSWER_ADDRESS, SRTTOKEN_ABI, QUESTIONANSWER_ABI } from './constant'

// Window tipini genişletelim
declare global {
  interface Window {
    ethereum: any;
    Buffer: typeof Buffer;
    process: any;
    global: any;
  }
}

interface Question {
  id: ethers.BigNumber;
  author: string;
  content: string;
  timestamp: ethers.BigNumber;
  answerIds: ethers.BigNumber[];
}

interface Answer {
  id: ethers.BigNumber;
  questionId: ethers.BigNumber;
  author: string;
  content: string;
  upvotes: ethers.BigNumber;
}

function App() {
  const [account, setAccount] = useState<string>('')
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null)
  const [qaContract, setQaContract] = useState<ethers.Contract | null>(null)
  const [tokenBalance, setTokenBalance] = useState<string>('0')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<{[questionId: number]: Answer[]}>({})
  const [newQuestion, setNewQuestion] = useState<string>('')
  const [newAnswer, setNewAnswer] = useState<string>('')
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [upvoteFee, setUpvoteFee] = useState<string>('10')
  const [networkError, setNetworkError] = useState<boolean>(false)

  useEffect(() => {
    const init = async () => {
      try {
        const detectedProvider = await detectEthereumProvider()
        
        if (detectedProvider) {
          // Önce hesapları iste
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          setAccount(accounts[0])
          
          // Ethereum sağlayıcısını ayarla
          const ethersProvider = new ethers.providers.Web3Provider(window.ethereum)
          setProvider(ethersProvider)
          
          // İmzalayıcıyı al
          const ethersSigner = ethersProvider.getSigner()
          setSigner(ethersSigner)
          
          // Kontratları oluştur
          const tokenContractInstance = new ethers.Contract(SRTTOKEN_ADDRESS, SRTTOKEN_ABI, ethersSigner)
          setTokenContract(tokenContractInstance)
          
          const qaContractInstance = new ethers.Contract(QUESTIONANSWER_ADDRESS, QUESTIONANSWER_ABI, ethersSigner)
          setQaContract(qaContractInstance)
          
          // Ağ değişikliğini dinle
          window.ethereum.on('chainChanged', (chainId: string) => {
            window.location.reload();
          });
          
          // Hesap değişikliğini dinle
          window.ethereum.on('accountsChanged', (accounts: string[]) => {
            setAccount(accounts[0])
          })
          
          // Mevcut ağı kontrol et
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          if (chainId !== '0xaa36a7') { // Sepolia chainId
            setNetworkError(true);
          } else {
            setNetworkError(false);
          }
        } else {
          console.error('MetaMask bulunamadı!')
        }
      } catch (error) {
        console.error('Başlatma hatası:', error)
      }
    }
    
    init()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (tokenContract && account && qaContract) {
        try {
          const balance = await tokenContract.balanceOf(account)
          setTokenBalance(ethers.utils.formatEther(balance))
          
          const fee = await qaContract.UPVOTE_FEE()
          setUpvoteFee(ethers.utils.formatEther(fee))
          
          await loadQuestions()
        } catch (error) {
          console.error('Veri çekme hatası:', error)
        }
      }
    }
    
    fetchData()
  }, [tokenContract, qaContract, account])

  const loadQuestions = async () => {
    if (!qaContract) return
    
    try {
      console.log('Sorular yükleniyor...')
      const allQuestions = await qaContract.getQuestions()
      console.log('Yüklenen sorular:', allQuestions)
      setQuestions(allQuestions)
      
      const answersMap: {[questionId: number]: Answer[]} = {}
      
      for (const question of allQuestions) {
        console.log(`Soru #${question.id.toString()} için cevaplar yükleniyor...`)
        const questionAnswers = await qaContract.getAnswersForQuestion(question.id)
        console.log(`Soru #${question.id.toString()} için cevaplar:`, questionAnswers)
        answersMap[question.id.toNumber()] = questionAnswers
      }
      
      setAnswers(answersMap)
    } catch (error) {
      console.error('Soruları yükleme hatası:', error)
    }
  }

  const createQuestion = async () => {
    if (!qaContract || !newQuestion) return
    
    setLoading(true)
    
    try {
      console.log('Soru oluşturuluyor...')
      const tx = await qaContract.createQuestion(newQuestion)
      console.log('İşlem gönderildi:', tx.hash)
      await tx.wait()
      console.log('İşlem tamamlandı')
      
      setNewQuestion('')
      await loadQuestions()
    } catch (error) {
      console.error('Soru oluşturma hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAnswer = async () => {
    if (!qaContract || !newAnswer || !selectedQuestionId) return
    
    setLoading(true)
    
    try {
      console.log(`Soru #${selectedQuestionId} için cevap oluşturuluyor...`)
      const tx = await qaContract.createAnswer(selectedQuestionId, newAnswer)
      console.log('İşlem gönderildi:', tx.hash)
      await tx.wait()
      console.log('İşlem tamamlandı')
      
      setNewAnswer('')
      setSelectedQuestionId(null)
      await loadQuestions()
    } catch (error) {
      console.error('Cevap oluşturma hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const upvoteAnswer = async (answerId: number) => {
    if (!qaContract || !tokenContract) return
    
    setLoading(true)
    
    try {
      console.log(`Cevap #${answerId} için token onayı veriliyor...`)
      const approveTx = await tokenContract.approve(QUESTIONANSWER_ADDRESS, ethers.utils.parseEther(upvoteFee))
      console.log('Onay işlemi gönderildi:', approveTx.hash)
      await approveTx.wait()
      console.log('Onay işlemi tamamlandı')
      
      console.log(`Cevap #${answerId} oylanıyor...`)
      const upvoteTx = await qaContract.upvoteAnswer(answerId)
      console.log('Oylama işlemi gönderildi:', upvoteTx.hash)
      await upvoteTx.wait()
      console.log('Oylama işlemi tamamlandı')
      
      await loadQuestions()
    } catch (error) {
      console.error('Oylama hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: ethers.BigNumber) => {
    return new Date(timestamp.toNumber() * 1000).toLocaleString('tr-TR')
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  // Sepolia ağına geçiş fonksiyonu
  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId: 11155111 (0xaa36a7)
      });
      
      // Ağ değişikliği başarılı olduğunda sayfayı yenile
      window.location.reload();
    } catch (switchError: any) {
      // Eğer Sepolia ağı yoksa, eklemeyi dene
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Test Network',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://rpc.sepolia.org', 'https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              },
            ],
          });
          
          // Ağ eklendikten sonra sayfayı yenile
          window.location.reload();
        } catch (addError) {
          console.error('Sepolia ağı eklenirken hata:', addError);
        }
      } else {
        console.error('Ağ değiştirme hatası:', switchError);
      }
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Soru & Cevap dApp</h1>
        <div className="account-info">
          {networkError ? (
            <div className="network-error">
              <p>Lütfen Sepolia test ağına bağlanın!</p>
              <button onClick={switchToSepolia}>Sepolia'ya Geç</button>
            </div>
          ) : account ? (
            <>
              <p>Hesap: {formatAddress(account)}</p>
              <p>Bakiye: {tokenBalance} SRT</p>
            </>
          ) : (
            <button onClick={async () => {
              try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
                setAccount(accounts[0])
                
                // Hesap bağlandıktan sonra Sepolia'ya geçmeyi dene
                switchToSepolia();
              } catch (error) {
                console.error('Bağlantı hatası:', error)
              }
            }}>
              Cüzdana Bağlan
            </button>
          )}
        </div>
      </header>

      <main>
        <section className="ask-question">
          <h2>Yeni Soru Sor</h2>
          <textarea 
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Sorunuzu buraya yazın..."
            disabled={loading || networkError}
          />
          <button onClick={createQuestion} disabled={!account || !newQuestion || loading || networkError}>
            {loading ? 'İşleniyor...' : 'Soru Sor'}
          </button>
          {networkError && (
            <div className="network-warning">
              <p>Soru sormak için Sepolia test ağına bağlanmalısınız.</p>
              <button onClick={switchToSepolia}>Sepolia'ya Geç</button>
            </div>
          )}
        </section>

        <section className="questions-list">
          <h2>Sorular</h2>
          {networkError ? (
            <div className="network-error-box">
              <p className="network-error-message">Sepolia test ağına bağlanın!</p>
              <button onClick={switchToSepolia}>Sepolia'ya Geç</button>
            </div>
          ) : questions.length === 0 ? (
            <p className="empty-state">Henüz soru yok. İlk soruyu siz sorun!</p>
          ) : (
            <ul>
              {questions.map((question) => (
                <li key={question.id.toNumber()}>
                  <div className="question-header">
                    <h3>Soru #{question.id.toNumber()}</h3>
                    <span className="timestamp">{formatTimestamp(question.timestamp)}</span>
                  </div>
                  
                  <p className="question-content">{question.content}</p>
                  <p className="asker">Soran: {formatAddress(question.author)}</p>
                  
                  <div className="answers-section">
                    <h4>Cevaplar ({answers[question.id.toNumber()]?.length || 0})</h4>
                    
                    {answers[question.id.toNumber()]?.length > 0 ? (
                      <ul className="answers-list">
                        {answers[question.id.toNumber()].map((answer) => (
                          <li key={answer.id.toNumber()} className="answer-item">
                            <div className="answer-content">
                              <p>{answer.content}</p>
                              <div className="answer-meta">
                                <span className="answerer">Cevaplayan: {formatAddress(answer.author)}</span>
                                <div className="upvote-section">
                                  <span className="upvote-count">{answer.upvotes.toNumber()} oy</span>
                                  <button 
                                    className="upvote-button"
                                    onClick={() => upvoteAnswer(answer.id.toNumber())}
                                    disabled={loading || networkError}
                                  >
                                    Oyla ({upvoteFee} SRT)
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-state">Henüz cevap yok. İlk cevabı siz verin!</p>
                    )}
                    
                    <div className="answer-form">
                      <textarea 
                        value={selectedQuestionId === question.id.toNumber() ? newAnswer : ''}
                        onChange={(e) => {
                          setSelectedQuestionId(question.id.toNumber())
                          setNewAnswer(e.target.value)
                        }}
                        placeholder="Cevabınızı yazın..."
                        disabled={loading || networkError}
                      />
                      <button 
                        onClick={createAnswer} 
                        disabled={selectedQuestionId !== question.id.toNumber() || !newAnswer || loading || networkError}
                      >
                        {loading ? 'İşleniyor...' : 'Cevapla'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
