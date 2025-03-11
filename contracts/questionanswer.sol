// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// OpenZeppelin kütüphanelerini içe aktarma
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title QuestionAnswer
 * @dev Soru-cevap platformu için akıllı kontrat
 * Kullanıcılar soru sorabilir, cevap verebilir ve cevapları oylayabilir
 */
contract QuestionAnswer is Ownable {
    // Soru veri yapısı
    struct Question {
        uint256 id;          // Soru ID'si
        address author;      // Soru sahibinin adresi
        string content;      // Soru içeriği
        uint256 timestamp;   // Sorunun oluşturulma zamanı
        uint256[] answerIds; // Soruya verilen cevapların ID'leri
    }

    // Cevap veri yapısı
    struct Answer {
        uint256 id;          // Cevap ID'si
        uint256 questionId;  // Cevabın ait olduğu sorunun ID'si
        address author;      // Cevap sahibinin adresi
        string content;      // Cevap içeriği
        uint256 upvotes;     // Cevabın aldığı oy sayısı
    }

    // SRT token kontratı
    IERC20 public srtToken = IERC20(0xF4cfBc57E554192090F6829c8BF9fC180835C995);
    // Oylama ücreti (10 SRT token)
    uint256 public constant UPVOTE_FEE = 10 * 10**18; // 10 OYK

    // Soru sayacı
    uint256 private questionCounter;
    // Cevap sayacı
    uint256 private answerCounter;
    
    // Soru ID'sinden soru bilgisine eşleme
    mapping(uint256 => Question) public questions;
    // Cevap ID'sinden cevap bilgisine eşleme
    mapping(uint256 => Answer) public answers;
    // Kullanıcının belirli bir cevabı oylayıp oylamadığını takip etme
    mapping(address => mapping(uint256 => bool)) public hasUpvoted;

    // Olaylar (Events)
    event QuestionCreated(uint256 indexed questionId, address indexed author, string content);
    event AnswerCreated(uint256 indexed answerId, uint256 indexed questionId, address indexed author, string content);
    event AnswerUpvoted(uint256 indexed answerId, address indexed voter);

    /**
     * @dev Kontrat oluşturucusu
     * @param initialOwner Kontratın başlangıç sahibi
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev İçeriğin boş olmamasını kontrol eden değiştirici
     * @param _content Kontrol edilecek içerik
     */
    modifier validContent(string memory _content) {
        require(bytes(_content).length > 0, "Content cannot be empty");
        _;
    }

    /**
     * @dev Sorunun var olduğunu kontrol eden değiştirici
     * @param _questionId Kontrol edilecek soru ID'si
     */
    modifier questionExists(uint256 _questionId) {
        require(_questionId < questionCounter, "Question does not exist");
        _;
    }

    /**
     * @dev Cevabın var olduğunu kontrol eden değiştirici
     * @param _answerId Kontrol edilecek cevap ID'si
     */
    modifier answerExists(uint256 _answerId) {
        require(_answerId < answerCounter, "Answer does not exist");
        _;
    }

    /**
     * @dev Oylama ücretinin doğru olduğunu kontrol eden değiştirici
     */
    modifier correctUpvoteFee() {
        require(msg.value == UPVOTE_FEE, "Incorrect upvote fee");
        _;
    }

    /**
     * @dev Kullanıcının cevabı daha önce oylamadığını kontrol eden değiştirici
     * @param _answerId Kontrol edilecek cevap ID'si
     */
    modifier notUpvoted(uint256 _answerId) {
        require(!hasUpvoted[msg.sender][_answerId], "Already upvoted this answer");
        _;
    }

    /**
     * @dev Yeni bir soru oluşturur
     * @param _content Soru içeriği
     */
    function createQuestion(string memory _content) public validContent(_content) {
        uint256[] memory emptyArray = new uint256[](0);
        questions[questionCounter] = Question({
            id: questionCounter,
            author: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            answerIds: emptyArray
        });

        emit QuestionCreated(questionCounter, msg.sender, _content);
        questionCounter++;
    }

    /**
     * @dev Bir soruya cevap oluşturur
     * @param _questionId Cevaplanacak sorunun ID'si
     * @param _content Cevap içeriği
     */
    function createAnswer(uint256 _questionId, string memory _content) public questionExists(_questionId) validContent(_content) {
        answers[answerCounter] = Answer({
            id: answerCounter,
            questionId: _questionId,
            author: msg.sender,
            content: _content,
            upvotes: 0
        });

        questions[_questionId].answerIds.push(answerCounter);

        emit AnswerCreated(answerCounter, _questionId, msg.sender, _content);
        answerCounter++;
    }

   /**
    * @dev Bir cevabı oylar
    * @param _answerId Oylanacak cevabın ID'si
    */
   function upvoteAnswer(uint256 _answerId) public answerExists(_answerId) notUpvoted(_answerId) {
       Answer storage answer = answers[_answerId];
       
       // Kullanıcıdan token transferi
       require(srtToken.transferFrom(msg.sender, address(this), UPVOTE_FEE), "Token transfer failed");
       
       // Ödeme bölüşümü hesaplama
       uint256 authorPayment = (UPVOTE_FEE * 80) / 100; // %80 cevap sahibine
       
       // Cevap sahibine ödeme
       require(srtToken.transfer(answer.author, authorPayment), "Author payment failed");
       // %20 kontrat içinde kalır (ücret olarak)

       // Oy sayısını artır ve kullanıcının oyladığını kaydet
       answer.upvotes++;
       hasUpvoted[msg.sender][_answerId] = true;

       emit AnswerUpvoted(_answerId, msg.sender);
   }

    /**
     * @dev Tüm soruları döndürür
     * @return Tüm soruların listesi
     */
    function getQuestions() public view returns (Question[] memory) {
        Question[] memory allQuestions = new Question[](questionCounter);
        for (uint256 i = 0; i < questionCounter; i++) {
            allQuestions[i] = questions[i];
        }
        return allQuestions;
    }

    /**
     * @dev Belirli bir sorunun cevaplarını döndürür
     * @param _questionId Cevapları istenilen sorunun ID'si
     * @return Sorunun cevaplarının listesi
     */
    function getAnswersForQuestion(uint256 _questionId) public view questionExists(_questionId) returns (Answer[] memory) {
        uint256[] memory answerIds = questions[_questionId].answerIds;
        Answer[] memory questionAnswers = new Answer[](answerIds.length);
        
        for (uint256 i = 0; i < answerIds.length; i++) {
            questionAnswers[i] = answers[answerIds[i]];
        }
        
        return questionAnswers;
    }

    /**
     * @dev Kontratın ETH bakiyesini döndürür
     * @return Kontratın ETH bakiyesi
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Kontratın token bakiyesini döndürür
     * @return Kontratın token bakiyesi
     */
    function getContractTokenBalance() public view returns (uint256) {
       return srtToken.balanceOf(address(this));
    }

    /**
     * @dev Kontrat içindeki tokenleri çeker
     * @param _to Tokenlerin gönderileceği adres
     */
    function withdrawTokens(address _to) public {
       // Add owner check etc.
       uint256 balance = srtToken.balanceOf(address(this));
       require(srtToken.transfer(_to, balance), "Withdrawal failed");
    }

    /**
     * @dev Kontrat içindeki ETH'yi çeker (sadece sahip)
     */
    function withdrawEther() public onlyOwner {
       uint256 balance = address(this).balance;
       require(balance > 0, "No ether to withdraw");
       
       (bool success, ) = payable(owner()).call{value: balance}("");
       require(success, "Withdrawal failed");
   }

    // ETH alabilmek için receive fonksiyonu
    receive() external payable {}
    // Bilinmeyen fonksiyon çağrıları için fallback
    fallback() external payable {}
}