// 게임 상태 관리
let currentScene = 1;
let selectedTree = null;
let gameResult = null;

// 상품 목록 (가이드에 따라)
const prizes = [
    { emoji: '🥤', name: '음료수 한잔', type: 'coupon', value: '음료수 쿠폰' },
    { emoji: '☕', name: '커피 한잔', type: 'coupon', value: '커피 쿠폰' },
    { emoji: '🍊', name: '귤 2개 선물', type: 'gift', value: '귤 2개' },
    { emoji: '💰', name: '1000원 쿠폰', type: 'coupon', value: '1,000원 할인' },
    { emoji: '🍜', name: '컵라면 하나', type: 'gift', value: '컵라면 쿠폰' },
    { emoji: '❌', name: '꽝', type: 'nothing', value: null }
];

// 효과음 (Web Audio API 사용)
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.init();
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    playSlotSound() {
        if (!this.audioContext) return;
        
        // 슬롯 회전 소리 생성
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 200;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    playResultSound(isWin) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        if (isWin) {
            // 승리 소리
            oscillator.frequency.value = 523; // C5
            setTimeout(() => {
                oscillator.frequency.value = 659; // E5
            }, 200);
            setTimeout(() => {
                oscillator.frequency.value = 784; // G5
            }, 400);
        } else {
            // 꽝 소리
            oscillator.frequency.value = 150;
            oscillator.type = 'sawtooth';
        }
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.8);
    }
}

const soundManager = new SoundManager();

// 씬 전환 함수
function showScene(sceneNumber) {
    // 현재 씬 숨기기
    const currentSceneElement = document.getElementById(`scene${currentScene}`);
    currentSceneElement.classList.remove('active');
    currentSceneElement.classList.add('fade-out');
    
    setTimeout(() => {
        currentSceneElement.classList.remove('fade-out');
        
        // 새 씬 보여주기
        const newSceneElement = document.getElementById(`scene${sceneNumber}`);
        newSceneElement.classList.add('active', 'fade-in');
        
        setTimeout(() => {
            newSceneElement.classList.remove('fade-in');
        }, 500);
        
        currentScene = sceneNumber;
    }, 250);
}

// 슬롯 애니메이션
function startSlotAnimation() {
    const slotItem = document.getElementById('slotItem');
    const slotItems = prizes.map(prize => prize.emoji);
    let animationCount = 0;
    const maxAnimations = 30; // 3초 동안 0.1초씩 변경
    
    soundManager.playSlotSound();
    
    const slotInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * slotItems.length);
        slotItem.textContent = slotItems[randomIndex];
        animationCount++;
        
        if (animationCount >= maxAnimations) {
            clearInterval(slotInterval);
            
            // 최종 결과 결정
            const resultIndex = Math.floor(Math.random() * prizes.length);
            gameResult = prizes[resultIndex];
            slotItem.textContent = gameResult.emoji;
            
            // 애니메이션 정지
            slotItem.style.animation = 'none';
            
            setTimeout(() => {
                showResultScene();
            }, 500);
        }
    }, 100);
}

// 특수 효과 생성
function createConfettiEffect() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.innerHTML = Math.random() > 0.5 ? '🎉' : '✨';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

function createAirplaneEffect() {
    const airplane = document.createElement('div');
    airplane.className = 'airplane';
    airplane.innerHTML = '✈️';
    document.body.appendChild(airplane);
    
    setTimeout(() => {
        airplane.remove();
    }, 3000);
}

// 결과 화면 표시
function showResultScene() {
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    const rewardBtn = document.getElementById('rewardBtn');
    const closeBtn = document.getElementById('closeBtn');
    
    if (gameResult.type === 'nothing') {
        // 꽝인 경우
        resultIcon.textContent = '😢';
        resultTitle.textContent = '아쉽지만...';
        resultMessage.textContent = '꽝! 내일 또 도전해보세요~';
        rewardBtn.style.display = 'none';
        closeBtn.textContent = '다시 도전';
        soundManager.playResultSound(false);
        createAirplaneEffect(); // 비행기 효과
    } else {
        // 당첨인 경우
        resultIcon.textContent = '🎉';
        resultTitle.textContent = '축하합니다!';
        resultMessage.textContent = `${gameResult.name} 당첨!`;
        rewardBtn.style.display = 'inline-block';
        rewardBtn.textContent = gameResult.type === 'coupon' ? '쿠폰 받기' : '선물 받기';
        closeBtn.textContent = '닫기';
        soundManager.playResultSound(true);
        createConfettiEffect(); // 폭죽/꽃놀이 효과
    }
    
    showScene(4);
}

// 쿠폰 화면 설정
function showCouponScene() {
    if (gameResult.type === 'nothing') return;
    
    const couponAmount = document.getElementById('couponAmount');
    couponAmount.textContent = gameResult.value;
    
    showScene(5);
}

// 로컬 스토리지에서 마지막 플레이 날짜 확인
function checkDailyLimit() {
    // 테스트 모드: 항상 true 반환 (제한 해제)
    return true;
    
    /* 실제 서비스시 아래 코드 사용
    const lastPlayDate = localStorage.getItem('lastPlayDate');
    const today = new Date().toDateString();
    
    if (lastPlayDate === today) {
        alert('오늘은 이미 게임을 플레이하셨습니다! 내일 다시 도전해보세요 😊');
        return false;
    }
    
    return true;
    */
}

// 게임 플레이 기록 저장
function savePlayRecord() {
    // 테스트 모드에서는 기록하지 않음
    return;
    
    /* 실제 서비스시 아래 코드 사용
    const today = new Date().toDateString();
    localStorage.setItem('lastPlayDate', today);
    */
}

// 개발자용: localStorage 초기화 함수 (콘솔에서 사용 가능)
function resetGameData() {
    localStorage.removeItem('lastPlayDate');
    console.log('게임 데이터가 초기화되었습니다.');
}

// 전역에서 사용할 수 있도록 window 객체에 추가
window.resetGameData = resetGameData;

// 예쁜 쿠폰 코드 생성
function generatePrettyCouponCode() {
    const prefixes = ['GYOOL', 'HAPPY', 'SWEET', 'LUCKY', 'GOLD'];
    const suffixes = ['2024', 'GIFT', 'LOVE', 'JOY', 'WIN'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const number = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${prefix}${number}${suffix}`;
}

// 쿠폰 다운로드 (이미지로 변환)
function downloadCoupon() {
    // Canvas를 사용해 쿠폰 이미지 생성
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 500;
    canvas.height = 400; // 충분한 여백 확보 (300 → 400, 33% 증가)
    
    // 고급스러운 배경 그라데이션 (더 부드럽게)
    const bgGradient = ctx.createLinearGradient(0, 0, 500, 400);
    bgGradient.addColorStop(0, '#FFFEF7');  // 아이보리
    bgGradient.addColorStop(0.3, '#FFF8DC'); // 크림색
    bgGradient.addColorStop(0.7, '#FFFACD'); // 레몬시폰
    bgGradient.addColorStop(1, '#F5F5DC');   // 베이지
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 500, 400);
    
    // 장식적인 외부 테두리 (더 세련되게)
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 488, 388); // 높이 더 증가
    
    // 내부 장식 테두리 (더 정교하게)
    ctx.strokeStyle = '#FF8C00';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 4]);
    ctx.strokeRect(18, 18, 464, 364); // 높이 더 증가
    ctx.setLineDash([]); // 점선 리셋
    
    // 추가 장식 선
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 1;
    ctx.strokeRect(25, 25, 450, 350); // 높이 더 증가
    
    // 코너 장식
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🍊', 40, 45);
    ctx.fillText('🍊', 460, 45);
    ctx.fillText('🍊', 40, 375); // 하단 코너들 더 아래로 이동
    ctx.fillText('🍊', 460, 375);
    
    // 상단 제목 - 고급스러운 그림자 효과
    ctx.fillStyle = '#D2691E';
    ctx.font = 'bold 28px NexonGothic, Arial';
    ctx.fillText('🍊 GYOOL PREMIUM COUPON 🍊', 252, 62);
    
    ctx.fillStyle = '#FF6B35';
    ctx.font = 'bold 28px NexonGothic, Arial';
    ctx.fillText('🍊 GYOOL PREMIUM COUPON 🍊', 250, 60);
    
    // 상품명 배경 (더 세련되게)
    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.fillRect(60, 80, 380, 45);
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, 80, 380, 45);
    
    // 상품명
    ctx.fillStyle = '#2E8B57';
    ctx.font = 'bold 24px NexonGothic, Arial';
    ctx.fillText(gameResult.value, 250, 108);
    
    // 쿠폰 코드 섹션 배경 (더 우아하게)
    ctx.fillStyle = 'rgba(255, 107, 53, 0.08)';
    ctx.fillRect(90, 145, 320, 50);
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(90, 145, 320, 50);
    
    // 쿠폰 코드 라벨
    ctx.fillStyle = '#FF6B35';
    ctx.font = 'bold 16px NexonGothic, Arial';
    ctx.fillText('✨ 쿠폰 코드 ✨', 250, 165);
    
    // 예쁜 쿠폰 코드 - 완전히 검은색으로
    const couponCode = generatePrettyCouponCode();
    
    // 메인 쿠폰 코드 텍스트 (70% 크기로 줄임)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 21px monospace';
    ctx.fillText(couponCode, 250, 185);
    
    // 실제 바코드 이미지 패턴 그리기 (중앙 정렬 및 개선)
    const barcodeWidth = 280;
    const barcodeHeight = 35;
    const barcodeX = (500 - barcodeWidth) / 2; // 중앙 정렬
    const barcodeY = 205;
    
    // 바코드 배경 (깔끔한 흰색)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(barcodeX - 5, barcodeY - 3, barcodeWidth + 10, barcodeHeight + 6);
    
    // 바코드 테두리 (얇은 회색)
    ctx.strokeStyle = '#DDDDDD';
    ctx.lineWidth = 1;
    ctx.strokeRect(barcodeX - 5, barcodeY - 3, barcodeWidth + 10, barcodeHeight + 6);
    
    // 실제 바코드 패턴 (더 정교하게)
    ctx.fillStyle = '#000000';
    
    // 바코드 패턴 배열 (더 균등하고 중앙 정렬)
    const barPattern = [
        3,1,1,1,3,1,1,1,2,1,3,1,1,1,1,1,2,1,1,1,3,1,2,1,1,1,1,1,3,1,1,1,2,1,
        1,1,1,1,3,1,2,1,1,1,3,1,1,1,1,1,2,1,3,1,1,1,1,1,2,1,1,1,3,1,2,1,1,1,
        1,1,3,1,1,1,2,1,1,1,1,1,3,1,2,1,1,1,3,1,1,1,1,1,2,1,3,1
    ];
    
    let currentX = barcodeX + 10;
    const totalPatternWidth = barPattern.reduce((sum, width) => sum + width, 0);
    const scaleFactor = (barcodeWidth - 20) / totalPatternWidth;
    
    for (let i = 0; i < barPattern.length; i++) {
        if (i % 2 === 0) { // 검은 바
            const barWidth = barPattern[i] * scaleFactor;
            ctx.fillRect(currentX, barcodeY + 2, barWidth, barcodeHeight - 4);
        }
        currentX += barPattern[i] * scaleFactor;
        
        if (currentX > barcodeX + barcodeWidth - 10) break;
    }
    
    // 바코드 하단에 숫자 (중앙 정렬)
    ctx.fillStyle = '#666666';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GNC15999604', 250, barcodeY + barcodeHeight + 15);
    
    // 유효기간 (수령일로부터 1개월)
    ctx.fillStyle = '#8B4513';
    ctx.font = '18px NexonGothic, Arial';
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    ctx.fillText(`유효기간: 수령일로부터 1개월 (${expiryDate.toLocaleDateString('ko-KR')}까지)`, 250, 315); // 충분한 간격
    
    // 하단 메시지 (사용법 안내)
    ctx.fillStyle = '#666';
    ctx.font = '16px NexonGothic, Arial';
    ctx.fillText('🏪 쿠폰을 저장하고, 신성의숲 인포메이션에 제시하세요', 250, 340); // 충분한 간격
    
    // 브랜드 서명 (테두리와 충분한 간격 확보)
    ctx.fillStyle = '#999';
    ctx.font = '14px NexonGothic, Arial';
    ctx.fillText('신성의 숲 × 귤나무 과수원', 250, 365); // 테두리와 충분한 간격
    
    // 다운로드
    const link = document.createElement('a');
    link.download = `gyool-coupon-${couponCode}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    // Scene 1: 시작 버튼
    document.getElementById('startBtn').addEventListener('click', function() {
        if (!checkDailyLimit()) return;
        showScene(2);
    });
    
    // Scene 2: 귤 선택
    const fruitItems = document.querySelectorAll('.fruit-item');
    fruitItems.forEach(item => {
        item.addEventListener('click', function() {
            selectedTree = this.dataset.tree;
            savePlayRecord();
            showScene(3);
            
            // 슬롯 애니메이션 시작
            setTimeout(() => {
                startSlotAnimation();
            }, 500);
        });
    });
    
    // Scene 4: 결과 화면 버튼들
    document.getElementById('rewardBtn').addEventListener('click', function() {
        showCouponScene();
    });
    
    document.getElementById('closeBtn').addEventListener('click', function() {
        if (gameResult && gameResult.type === 'nothing') {
            // 꽝인 경우 다시 도전
            location.reload();
        } else {
            // 당첨인 경우 처음으로
            showScene(1);
            gameResult = null;
            selectedTree = null;
        }
    });
    
    // Scene 5: 쿠폰 화면 버튼들
    document.getElementById('downloadBtn').addEventListener('click', function() {
        downloadCoupon();
    });
    
    document.getElementById('playAgainBtn').addEventListener('click', function() {
        showScene(1);
        gameResult = null;
        selectedTree = null;
    });
});

// 모바일 터치 이벤트 최적화
document.addEventListener('touchstart', function() {
    // iOS Safari에서 Web Audio 활성화
    if (soundManager.audioContext && soundManager.audioContext.state === 'suspended') {
        soundManager.audioContext.resume();
    }
}, { once: true });

// 페이지 가시성 변경 시 처리
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 페이지가 숨겨질 때 애니메이션 일시 정지
        const slotItem = document.getElementById('slotItem');
        if (slotItem) {
            slotItem.style.animationPlayState = 'paused';
        }
    } else {
        // 페이지가 다시 보일 때 애니메이션 재개
        const slotItem = document.getElementById('slotItem');
        if (slotItem) {
            slotItem.style.animationPlayState = 'running';
        }
    }
}); 