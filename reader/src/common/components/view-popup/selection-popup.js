import React, { useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import cx from 'classnames';
import { ANNOTATION_COLORS } from '../../defines';
import ViewPopup from './common/view-popup';
import CustomSections from '../common/custom-sections';

import { IconColor16 } from '../common/icons';

import IconHighlight from '../../../../res/icons/16/annotate-highlight.svg';
import IconUnderline from '../../../../res/icons/16/annotate-underline.svg';

function SelectionPopup(props) {
	const intl = useIntl();
	const [selectedContent, setSelectedContent] = useState(null);
	const [isContentListOpen, setIsContentListOpen] = useState(false);
	// const [flattenedCategories, setFlattenedCategories] = useState([]);

	// useEffect(() => {
	// 	console.log('SelectionPopup props:', props);
	// 	console.log('Contents from props:', props.categories);
		
	// 	if (props.categories) {
	// 		const flattened = props.categories.reduce((acc, category) => {
	// 			console.log('Processing category:', category);
	// 			const categoryContents = category.map(content => ({
	// 				id: content.id,
	// 				title: category.title,
	// 			}));
	// 			return [...acc, ...categoryContents];
	// 		}, []);
			
	// 		console.log('Flattened categories:', flattened);
	// 		setFlattenedCategories(flattened);
	// 	}
	// }, [props.categories]);

	function handleColorPick(color) {
		let type = props.textSelectionAnnotationMode;
		
		// 기본 어노테이션 객체 생성
		const annotationData = {
			...props.params.annotation,
			type,
			color
		};

		// 콘텐츠가 선택되어 있다면 콘텐츠 정보 추가
		if (selectedContent) {
			annotationData.contentId = selectedContent.id;
			annotationData.contentTitle = selectedContent.title;
			annotationData.contentDescription = selectedContent.content;
		}

		props.onAddAnnotation(annotationData);
	}

	function handleAddToNote() {
		props.onAddToNote([props.params.annotation]);
	}

	function handleContentSelect(content) {
		console.log('Selected content:', content);
		setSelectedContent(content);
		setIsContentListOpen(false);
		if (typeof props.onContentSelect === 'function') {
			props.onContentSelect(content.id);
		}
	}

	function handleButtonClick() {
		// console.log('Button clicked, current contents:', flattenedCategories);
		setIsContentListOpen(!isContentListOpen);
	}

	return (
		<ViewPopup
			className="selection-popup"
			rect={props.params.rect}
			uniqueRef={{}}
			padding={20}
		>
			{/* Content 선택 드롭다운 (선택사항) */}
			<div className="content-selector">
				<button
					className="content-selector-button"
					onClick={handleButtonClick}
				>
					<span className="content-selector-text">
						{selectedContent ? `${selectedContent.title}` : '콘텐츠 분류 선택 (선택사항)'}
					</span>
					<svg
						className={cx('content-selector-arrow', { open: isContentListOpen })}
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
				{isContentListOpen && (
					<div className="content-list">
						{props.categories.length > 0 ? (
							props.categories.map(category => (
								<button
									key={category.id}
									className={cx('content-list-item', {
										selected: selectedContent?.id === category.id
									})}
									onClick={() => handleContentSelect(category)}
								>
									<div className="content-title">{category.title}</div>
								</button>
							))
						) : (
							<div className="content-list-item">
								<div className="content-title">사용 가능한 카테고리가 없습니다</div>
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
					>
						<IconColor16 color={color[1]}/>
					</button>
				))}
			</div>

			{/* 하이라이트/밑줄 선택 UI */}
			<div className="tool-toggle" data-tabstop={1}>
				<button
					tabIndex={-1}
					className={cx('highlight', { active: props.textSelectionAnnotationMode === 'highlight' })}
					title={intl.formatMessage({ id: 'pdfReader.highlightText' })}
					onClick={() => props.onChangeTextSelectionAnnotationMode('highlight')}
				>
					<IconHighlight/>
				</button>
				<button
					tabIndex={-1}
					className={cx('underline', { active: props.textSelectionAnnotationMode === 'underline' })}
					title={intl.formatMessage({ id: 'pdfReader.underlineText' })}
					onClick={() => props.onChangeTextSelectionAnnotationMode('underline')}
				>
					<IconUnderline/>
				</button>
			</div>

			{props.enableAddToNote && (
				<button 
					className="toolbar-button wide-button" 
					data-tabstop={1} 
					onClick={handleAddToNote}
				>
					<FormattedMessage id="pdfReader.addToNote"/>
				</button>
			)}
			<CustomSections type="TextSelectionPopup" annotation={props.params.annotation}/>
		</ViewPopup>
	);
}

export default SelectionPopup;
