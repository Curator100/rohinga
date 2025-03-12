// Google Sheets API Configuration
const API_KEY = 'AIzaSyDC_aqgXAhScsYg85qTTs1fQcUtgn2Z2xQ';
const SHEET_ID = '1SooENiPHUascCufx52Zw6Zr0iA5OH8_1MBYTw6D0zPo';

// Telegram Configuration
const TELEGRAM_BOT_TOKEN = '7447671480:AAFtEWOh_y3k5UpIeUnV-5fJdV3L-RlqC6M';
const TELEGRAM_CHAT_ID = '906269717';

// Cart Management
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.total = 0;
        this.init();
    }

    init() {
        this.updateDisplay();
        this.setupCartIcon();
    }

    setupCartIcon() {
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.addEventListener('click', () => {
                const cartPopup = document.querySelector('.cart-popup');
                cartPopup.style.display = cartPopup.style.display === 'none' ? 'block' : 'none';
            });
        }
    }

    addItem(product) {
        this.items.push(product);
        this.updateStorage();
        this.updateDisplay();
    }

    updateStorage() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    updateDisplay() {
        const cartPopup = document.querySelector('.cart-popup');
        if (!cartPopup) return;

        const cartItems = cartPopup.querySelector('.cart-items');
        const cartTotal = cartPopup.querySelector('.cart-total');
        
        cartItems.innerHTML = this.items.map(item => `
            <div class="cart-item">
                <span>${item.name}</span>
                <span>${item.price} Taka</span>
                <button onclick="cart.removeItem('${item.id}')">Remove</button>
            </div>
        `).join('');
        
        this.total = this.items.reduce((sum, item) => sum + item.price, 0);
        cartTotal.textContent = `Total: ${this.total} Taka`;
    }

    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.updateStorage();
        this.updateDisplay();
    }
}

// Membership Management
class MembershipManager {
    constructor() {
        this.setupMembershipButtons();
    }

    setupMembershipButtons() {
        document.querySelectorAll('.member-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showMembershipDialog());
        });
    }

    async verifyMembership(roll) {
        try {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1?key=${API_KEY}`
            );
            const data = await response.json();
            return data.values.some(row => row[0] === roll);
        } catch (error) {
            console.error('Error verifying membership:', error);
            return false;
        }
    }

    showMembershipDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'membership-dialog modal';
        dialog.innerHTML = `
            <div class="modal-content">
                <h2>Member Verification</h2>
                <input type="text" id="rollInput" placeholder="Enter your Roll Number">
                <button onclick="membershipManager.checkRoll()">Verify</button>
                <p>Not a member? <a href="#" onclick="membershipManager.showMembershipOptions()">Want to become a member?</a></p>
                <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    async checkRoll() {
        const roll = document.getElementById('rollInput').value;
        const isMember = await this.verifyMembership(roll);
        
        if (isMember) {
            localStorage.setItem('memberRoll', roll);
            this.showPrices();
            document.querySelector('.membership-dialog').remove();
        } else {
            alert('Roll number not found. Would you like to become a member?');
            this.showMembershipOptions();
        }
    }

    showMembershipOptions() {
        const dialog = document.createElement('div');
        dialog.className = 'membership-options modal';
        dialog.innerHTML = `
            <div class="modal-content">
                <h2>Exclusive Membership Benefits</h2>
                <h3>Three Premium Ways to Join:</h3>
                <div class="membership-paths">
                    <div class="path">
                        <h4>Direct Membership</h4>
                        <p>Join instantly with a one-time fee of 500 Taka</p>
                        <button onclick="membershipManager.showPaymentForm()">Select</button>
                    </div>
                    <div class="path">
                        <h4>Membership Lottery</h4>
                        <p>Try your luck in our exclusive membership draw</p>
                        <button onclick="membershipManager.showLotteryForm()">Enter Lottery</button>
                    </div>
                    <div class="path">
                        <h4>Referral Program</h4>
                        <p>Get referred by an existing member</p>
                        <button onclick="membershipManager.showReferralForm()">Use Referral</button>
                    </div>
                </div>
                <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    showLotteryForm() {
        const form = document.createElement('div');
        form.className = 'lottery-form modal';
        form.innerHTML = `
            <div class="modal-content">
                <h2>Membership Lottery Entry</h2>
                <form id="lotteryForm" onsubmit="membershipManager.submitLotteryForm(event)">
                    <div class="form-group">
                        <label for="name">Full Name</label>
                        <input type="text" id="name" required>
                    </div>
                    <div class="form-group">
                        <label for="address">Address</label>
                        <textarea id="address" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone Number</label>
                        <input type="tel" id="phone" required>
                    </div>
                    <button type="submit">Submit Entry</button>
                </form>
                <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
            </div>
        `;
        document.body.appendChild(form);
    }

    async submitLotteryForm(event) {
        event.preventDefault();
        const formData = {
            name: document.getElementById('name').value,
            address: document.getElementById('address').value,
            phone: document.getElementById('phone').value
        };

        const message = `New Lottery Entry:\nName: ${formData.name}\nAddress: ${formData.address}\nPhone: ${formData.phone}`;

        try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message
                })
            });
            alert('Your lottery entry has been submitted successfully! We will contact you if you win.');
            document.querySelector('.lottery-form').remove();
        } catch (error) {
            console.error('Error sending to Telegram:', error);
            alert('There was an error submitting your entry. Please try again.');
        }
    }

    showPrices() {
        document.querySelectorAll('.hidden-price').forEach(price => {
            price.style.display = 'block';
        });
        document.querySelectorAll('.member-btn').forEach(btn => {
            btn.style.display = 'none';
        });
    }
}

// Initialize cart and membership manager
const cart = new Cart();
const membershipManager = new MembershipManager();

// Check if user is already a member
if (localStorage.getItem('memberRoll')) {
    membershipManager.showPrices();
} 
