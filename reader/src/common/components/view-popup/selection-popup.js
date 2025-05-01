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
	const [flattenedContents, setFlattenedContents] = useState([]);

	useEffect(() => {
		console.log('SelectionPopup props:', props);
		console.log('Contents from props:', props.contents);
		
		if (props.contents) {
			const flattened = props.contents.reduce((acc, topic) => {
				console.log('Processing topic:', topic);
				const topicContents = topic.contents.map(content => ({
					id: content.id,
					title: topic.title,
					content: content.content
				}));
				return [...acc, ...topicContents];
			}, []);
			
			console.log('Flattened contents:', flattened);
			setFlattenedContents(flattened);
		}
	}, [props.contents]);

	function handleColorPick(color) {
		let type = props.textSelectionAnnotationMode;
		if (!selectedContent) {
			// 컨텐츠가 선택되지 않았다면 annotation 생성하지 않음
			return;
		}
		props.onAddAnnotation({ 
			...props.params.annotation, 
			type, 
			color,
			contentId: selectedContent.id,
			contentTitle: selectedContent.title,
			contentDescription: selectedContent.content
		});
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
		console.log('Button clicked, current contents:', flattenedContents);
		setIsContentListOpen(!isContentListOpen);
	}

	return (
		<ViewPopup
			className="selection-popup"
			rect={props.params.rect}
			uniqueRef={{}}
			padding={20}
		>
			{/* Content 선택 드롭다운 */}
			<div className="content-selector">
				<button
					className="content-selector-button"
					onClick={handleButtonClick}
				>
					<span className="content-selector-text">
						{selectedContent ? `${selectedContent.title} - ${selectedContent.content}` : '컨텐츠 분류 선택'}
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
						{flattenedContents.length > 0 ? (
							flattenedContents.map(content => (
								<button
									key={content.id}
									className={cx('content-list-item', {
										selected: selectedContent?.id === content.id
									})}
									onClick={() => handleContentSelect(content)}
								>
									<div className="content-title">{content.title}</div>
									<div className="content-description">{content.content}</div>
								</button>
							))
						) : (
							<div className="content-list-item">
								<div className="content-title">사용 가능한 컨텐츠가 없습니다</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* 기존 색상 선택 UI */}
			<div className="colors" data-tabstop={1}>
				{ANNOTATION_COLORS.map((color, index) => (
					<button
						key={index}
						tabIndex={-1}
						className="toolbar-button color-button"
						title={intl.formatMessage({ id: color[0] })}
						onClick={() => handleColorPick(color[1])}
						disabled={!selectedContent}
					>
						<IconColor16 color={color[1]}/>
					</button>
				))}
			</div>

			{/* 기존 하이라이트/밑줄 선택 UI */}
			<div className="tool-toggle" data-tabstop={1}>
				<button
					tabIndex={-1}
					className={cx('highlight', { active: props.textSelectionAnnotationMode === 'highlight' })}
					title={intl.formatMessage({ id: 'pdfReader.highlightText' })}
					onClick={() => props.onChangeTextSelectionAnnotationMode('highlight')}
					disabled={!selectedContent}
				>
					<IconHighlight/>
				</button>
				<button
					tabIndex={-1}
					className={cx('underline', { active: props.textSelectionAnnotationMode === 'underline' })}
					title={intl.formatMessage({ id: 'pdfReader.underlineText' })}
					onClick={() => props.onChangeTextSelectionAnnotationMode('underline')}
					disabled={!selectedContent}
				>
					<IconUnderline/>
				</button>
			</div>

			{props.enableAddToNote && (
				<button 
					className="toolbar-button wide-button" 
					data-tabstop={1} 
					onClick={handleAddToNote}
					disabled={!selectedContent}
				>
					<FormattedMessage id="pdfReader.addToNote"/>
				</button>
			)}
			<CustomSections type="TextSelectionPopup" annotation={props.params.annotation}/>
		</ViewPopup>
	);
}

export default SelectionPopup;
