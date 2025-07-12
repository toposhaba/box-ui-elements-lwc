import * as React from 'react';

import ItemList from './ItemList';
import UploadState from './UploadState';

import makeDroppable from '../common/droppable';
import type { UploadFile, UploadFileWithAPIOptions, UploadItem } from '../../common/types/upload';
import type { DOMStringList, View } from '../../common/types/core';

import './DroppableContent.scss';

export interface DroppableContentProps {
    addDataTransferItemsToUploadQueue: (droppedItems: DataTransfer) => void;
    addFiles: (files?: Array<UploadFileWithAPIOptions | UploadFile>) => void;
    allowedTypes: Array<string>;
    canDrop: boolean;
    isFolderUploadEnabled: boolean;
    isOver: boolean;
    isTouch: boolean;
    items: UploadItem[];
    onClick: (item: UploadItem) => void;
    view: View;
    enableOCR?: boolean;
    enableTranscription?: boolean;
    onOCRChange?: (enabled: boolean) => void;
    onTranscriptionChange?: (enabled: boolean) => void;
}

/**
 * Definition for drag and drop behavior.
 */
const dropDefinition = {
    /**
     * Validates whether a file can be dropped or not.
     */
    dropValidator: (
        { allowedTypes }: { allowedTypes: Array<string> },
        { types }: { types: Array<string> | DOMStringList },
    ) => {
        if (types instanceof Array) {
            return Array.from(types).some(type => allowedTypes.indexOf(type) > -1);
        }

        const allowedList = allowedTypes.filter(allowed => types.contains(allowed));
        return allowedList.length > 0;
    },

    /**
     * Determines what happens after a file is dropped
     */
    onDrop: (event, { addDataTransferItemsToUploadQueue }: DroppableContentProps) => {
        const { dataTransfer } = event;
        addDataTransferItemsToUploadQueue(dataTransfer);
    },
} as const;

const DroppableContent = makeDroppable(dropDefinition)(({
    addFiles,
    canDrop,
    isFolderUploadEnabled,
    isOver,
    isTouch,
    items,
    onClick,
    view,
    enableOCR,
    enableTranscription,
    onOCRChange,
    onTranscriptionChange,
}: DroppableContentProps) => {
    const handleSelectFiles = ({ target: { files } }) => addFiles(files);
    const hasItems = items.length > 0;

    return (
        <div className="bcu-droppable-content" data-testid="bcu-droppable-content">
            <ItemList items={items} onClick={onClick} />
            <UploadState
                canDrop={canDrop}
                hasItems={hasItems}
                isFolderUploadEnabled={isFolderUploadEnabled}
                isOver={isOver}
                isTouch={isTouch}
                onSelect={handleSelectFiles}
                view={view}
                enableOCR={enableOCR}
                enableTranscription={enableTranscription}
                onOCRChange={onOCRChange}
                onTranscriptionChange={onTranscriptionChange}
            />
        </div>
    );
});

export default DroppableContent;
