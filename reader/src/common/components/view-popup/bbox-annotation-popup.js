import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import cx from 'classnames';
import { ANNOTATION_COLORS } from '../../defines';
import ViewPopup from './common/view-popup';

import { IconColor16 } from '../common/icons';
import IconArea from '../../../../res/icons/16/annotate-area.svg';

function BBoxAnnotationPopup(props) {
	const intl = useIntl();
	const [selectedCategory, setSelectedCategory] = useState(null);
	const [isCategoryListOpen, setIsCategoryListOpen] = useState(false);

	function handleColorPick(color) {
		// 기본 어노테이션 객체 생성
		const annotationData = {
			...props.params.annotation,
			type: 'image',
			color,
			extractedText: props.params.extractedText
		};

		// 카테고리가 선택되어 있다면 카테고리 정보 추가
		if (selectedCategory) {
			annotationData.categoryId = selectedCategory.id;
			annotationData.categoryName = selectedCategory.name;
			annotationData.categoryDescription = selectedCategory.comment;
		}

		props.onAddAnnotation(annotationData);
		props.onCloseBBoxPopup();
	}

	function handleCategorySelect(category) {
		console.log('Selected category:', category);
		setSelectedCategory(category);
		setIsCategoryListOpen(false);
		if (typeof props.onCategorySelect === 'function') {
			props.onCategorySelect(category.id);
		}
	}

	function handleButtonClick() {
		setIsCategoryListOpen(!isCategoryListOpen);
	}

	function handleCancel() {
		props.onCloseBBoxPopup();
	}

	return (
		<ViewPopup
			className="bbox-annotation-popup"
			rect={props.params.rect}
			uniqueRef={{}}
			padding={20}
		>
			{/* 추출된 텍스트 표시 */}
			{props.params.extractedText && (
				<div className="extracted-text">
					<div className="extracted-text-label">추출된 텍스트:</div>
					<div className="extracted-text-content">{props.params.extractedText}</div>
				</div>
			)}

			{/* 카테고리 선택 드롭다운 */}
			<div className="category-selector">
				<button
					className="category-selector-button"
					onClick={handleButtonClick}
				>
					<span className="category-selector-text">
						{selectedCategory ? `${selectedCategory.name}` : '카테고리 선택 (필수)'}
					</span>
					<svg
						className={cx('category-selector-arrow', { open: isCategoryListOpen })}
						viewBox="0 0 24 24"
					>
						<path
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>
				{isCategoryListOpen && (
					<div className="category-list">
						{props.categories && props.categories.length > 0 ? (
							props.categories.map(category => (
								<button
									key={category.id}
									className={cx('category-list-item', {
										selected: selectedCategory?.id === category.id
									})}
									onClick={() => handleCategorySelect(category)}
								>
									<div className="category-title">{category.name}</div>
									{category.comment && (
										<div className="category-description">{category.comment}</div>
									)}
								</button>
							))
						) : (
							<div className="category-list-item">
								<div className="category-title">사용 가능한 카테고리가 없습니다</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* 색상 선택 UI */}
			<div className="colors" data-tabstop={1}>
				{ANNOTATION_COLORS.map((color, index) => (
					<button
						key={index}
						tabIndex={-1}
						className="toolbar-button color-button"
						title={intl.formatMessage({ id: color[0] })}
						onClick={() => handleColorPick(color[1])}
						disabled={!selectedCategory}
					>
						<IconColor16 color={color[1]}/>
					</button>
				))}
			</div>

			{/* 액션 버튼들 */}
			<div className="action-buttons">
				<button
					className="toolbar-button wide-button cancel-button"
					onClick={handleCancel}
				>
					취소
				</button>
				{selectedCategory && (
					<button
						className="toolbar-button wide-button primary-button"
						onClick={() => handleColorPick('#ffd400')}
					>
						<IconArea/>
						<span>BBox 추가</span>
					</button>
				)}
			</div>
		</ViewPopup>
	);
}

export default BBoxAnnotationPopup;
