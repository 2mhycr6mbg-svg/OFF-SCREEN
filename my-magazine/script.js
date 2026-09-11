document.addEventListener('DOMContentLoaded', () => {
    // 🔑 관리자 비밀번호
    const ADMIN_PASSWORD = "202221840"; 

    let currentSelectedArticleIndex = null; // 현재 열린 기사 인덱스

    // 탭 전환 처리
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');

            // '새 글 업로드' 탭 클릭 시 비밀번호 검증
            if (targetId === 'upload-section') {
                const inputPassword = prompt("관리자 비밀번호를 입력하세요:");
                if (inputPassword !== ADMIN_PASSWORD) {
                    alert("비밀번호가 일치하지 않습니다. 업로드 권한이 없습니다.");
                    return;
                }
            }

            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 이미지 파일 자동 용량 압축 (용량 초과 에러 방지)
    const resizeImage = (file, maxWidth, maxHeight, callback) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                callback(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    // 대표 썸네일 이미지 미리보기
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('image-preview');
    let base64Image = '';

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            resizeImage(file, 800, 600, (compressedDataUrl) => {
                base64Image = compressedDataUrl;
                imagePreview.innerHTML = `<img src="${base64Image}" alt="미리보기">`;
            });
        } else {
            base64Image = '';
            imagePreview.innerHTML = '<span>대표 이미지 미리보기</span>';
        }
    });

    // 본문 내 이미지 커스텀 삽입 기능
    const btnInsertImg = document.getElementById('btn-insert-img');
    const bodyImageInput = document.getElementById('body-image-input');
    const contentEditor = document.getElementById('content-editor');

    btnInsertImg.addEventListener('click', () => {
        bodyImageInput.click();
    });

    bodyImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            resizeImage(file, 800, 800, (compressedDataUrl) => {
                const imgTag = `<img src="${compressedDataUrl}" alt="본문 이미지"><br>`;
                contentEditor.focus();
                document.execCommand('insertHTML', false, imgTag);
            });
        }
        bodyImageInput.value = '';
    });

    // 모달 요소를 위한 참조
    const modal = document.getElementById('article-modal');
    const modalCategory = document.getElementById('modal-category');
    const modalDate = document.getElementById('modal-date');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalDeleteBtn = document.getElementById('modal-delete-btn');

    // 모달 열기 함수
    const openModal = (index) => {
        const articles = JSON.parse(localStorage.getItem('weeklyArticles')) || [];
        const item = articles[index];
        if (!item) return;

        currentSelectedArticleIndex = index;
        modalCategory.textContent = item.category;
        modalDate.textContent = item.date;
        modalTitle.textContent = item.title;
        modalBody.innerHTML = item.content;

        modal.classList.add('active');
    };

    // 모달 닫기 함수
    const closeModal = () => {
        modal.classList.remove('active');
        currentSelectedArticleIndex = null;
    };

    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // 아티클 저장 및 불러오기 (LocalStorage)
    const articleForm = document.getElementById('article-form');
    const articleGrid = document.getElementById('article-grid');

    const loadArticles = () => {
        const articles = JSON.parse(localStorage.getItem('weeklyArticles')) || [];
        articleGrid.innerHTML = '';

        if (articles.length === 0) {
            articleGrid.innerHTML = '<p class="empty-msg">등록된 아티클이 없습니다. 새 아티클을 작성해보세요!</p>';
            return;
        }

        articles.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'article-card';
            
            const thumbSrc = item.image || 'https://via.placeholder.com/400x200?text=No+Image';

            card.innerHTML = `
                <div class="card-img-wrapper">
                    <img src="${thumbSrc}" alt="${item.title}">
                </div>
                <div class="card-body">
                    <div class="card-meta">
                        <span class="category-tag">${item.category}</span>
                        <span>${item.date}</span>
                    </div>
                    <h3 class="card-title">${item.title}</h3>
                </div>
            `;

            // 카드 클릭 시 모달 열기
            card.addEventListener('click', () => {
                openModal(index);
            });

            articleGrid.appendChild(card);
        });
    };

    // 폼 제출 이벤트
    articleForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const content = contentEditor.innerHTML;
        const today = new Date().toLocaleDateString('ko-KR');

        if (!contentEditor.textContent.trim() && !content.includes('<img')) {
            alert('기사 본문 내용을 입력해 주세요.');
            return;
        }

        const newArticle = {
            title,
            category,
            content,
            image: base64Image,
            date: today
        };

        try {
            const articles = JSON.parse(localStorage.getItem('weeklyArticles')) || [];
            articles.unshift(newArticle);
            localStorage.setItem('weeklyArticles', JSON.stringify(articles));

            // 폼 초기화
            articleForm.reset();
            imageInput.value = '';
            contentEditor.innerHTML = '';
            imagePreview.innerHTML = '<span>대표 이미지 미리보기</span>';
            base64Image = ''; 

            alert('성공적으로 발행되었습니다!');

            loadArticles();
            document.querySelector('[data-target="article-section"]').click();
        } catch (err) {
            alert('저장 용량이 초과되었거나 오류가 발생했습니다. 기존 글을 삭제한 뒤 다시 시도해 주세요.');
            console.error(err);
        }
    });

    // 모달 내부 삭제 버튼 처리
    modalDeleteBtn.addEventListener('click', () => {
        if (currentSelectedArticleIndex === null) return;

        const inputPassword = prompt("삭제 권한이 필요합니다. 관리자 비밀번호를 입력하세요:");
        
        if (inputPassword === ADMIN_PASSWORD) {
            if (confirm('정말로 이 아티클을 삭제하시겠습니까?')) {
                const articles = JSON.parse(localStorage.getItem('weeklyArticles')) || [];
                articles.splice(currentSelectedArticleIndex, 1);
                localStorage.setItem('weeklyArticles', JSON.stringify(articles));
                closeModal();
                loadArticles();
            }
        } else if (inputPassword !== null) {
            alert("비밀번호가 일치하지 않습니다.");
        }
    });

    // 초기 로드
    loadArticles();
});