// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.26;

// ERC-20 standartına uygun bir arayüz 
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract SRTTOKEN is IERC20 {
    // Transfer ve onay işlemleri için event'ler tanımlanıyor.
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // Toplam token arzı
    uint256 public totalSupply;

    // Kullanıcı bakiyelerini saklayan mapping
    mapping(address => uint256) public balanceOf;

    // Harcama izinlerini saklayan mapping
    mapping(address => mapping(address => uint256)) public allowance;

    // Sözleşme sahibi
    address public owner;

    string public name;
    string public symbol;
    uint8 public decimals;

    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        balanceOf[msg.sender] = totalSupply; // Sözleşme sahibine tüm tokenleri ver
        owner = msg.sender;
        emit Transfer(address(0), msg.sender, totalSupply); // İlk token dağıtımını event olarak yayınla
    }

    // Kullanıcıdan kullanıcıya transfer
    function transfer(address recipient, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Yetersiz bakiye!");
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    // Harcama izni belirleme
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    // Harcama izni olan kullanıcı adına transfer işlemi gerçekleştirme
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        require(allowance[sender][msg.sender] >= amount, "Harcama izni yok!");
        require(balanceOf[sender] >= amount, "Yetersiz bakiye!");

        allowance[sender][msg.sender] -= amount;
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;

        emit Transfer(sender, recipient, amount);
        return true;
    }

}
