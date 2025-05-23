import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { IS_APPLE, mergeRegister } from '@lexical/utils'
import type { NodeKey } from 'lexical'
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  $nodesOfType,
  COMMAND_PRIORITY_CRITICAL,
  DROP_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  INSERT_TAB_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_TAB_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  PASTE_COMMAND,
  REDO_COMMAND,
  SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
  UNDO_COMMAND,
} from 'lexical'
import { useEffect, useRef, useState } from 'react'
import { ProtonNode, $isSuggestionNode } from './ProtonNode'
import { SuggestionTypesThatCanBeEmpty, type SuggestionID } from './Types'
import { BEFOREINPUT_EVENT_COMMAND, COMPOSITION_START_EVENT_COMMAND, INSERT_FILE_COMMAND } from '../../Commands/Events'
import { type EditorRequiresClientMethods } from '@proton/docs-shared'
import { reportErrorToSentry } from '../../Utils/errorMessage'
import { useMarkNodesContext } from '../MarkNodesContext'
import { ACCEPT_SUGGESTION_COMMAND, REJECT_SUGGESTION_COMMAND, TOGGLE_SUGGESTION_MODE_COMMAND } from './Commands'
import debounce from '@proton/utils/debounce'
import { UNORDERED_LIST, ORDERED_LIST, CHECK_LIST } from '@lexical/markdown'
import { $acceptSuggestion } from './acceptSuggestion'
import { $rejectSuggestion } from './rejectSuggestion'
import { $handleBeforeInputEvent } from './handleBeforeInputEvent'
import { $formatTextAsSuggestion } from './formatTextAsSuggestion'
import { Logger } from '@proton/utils/logs'
import { $selectionInsertClipboardNodes } from './selectionInsertClipboardNodes'
import { KEYBOARD_SHORTCUT_COMMAND } from '../KeyboardShortcuts/Command'
import { getShortcutFromKeyboardEvent } from '../KeyboardShortcuts/Utils'
import { LINK_CHANGE_COMMAND } from '../Link/LinkPlugin'
import { $handleLinkChangeSuggestion } from './handleLinkChangeSuggestion'
import { CLEAR_FORMATTING_COMMAND, SET_SELECTION_STYLE_PROPERTY_COMMAND } from '../FormattingPlugin'
import { $patchStyleAsSuggestion } from './patchStyleAsSuggestion'
import { generateSuggestionSummary } from './generateSuggestionSummary'
import { INSERT_IMAGE_NODE_COMMAND, SET_IMAGE_SIZE_COMMAND } from '../Image/ImagePlugin'
import { $handleImageDragAndDropAsSuggestion, $handleImageSizeChangeAsSuggestion } from './imageHandling'
import { EditorUserMode } from '../../Lib/EditorUserMode'
import { $handleIndentOutdentAsSuggestion } from './handleIndentOutdent'
import { useGenericAlertModal } from '@proton/docs-shared/components/GenericAlert'
import { c } from 'ttag'
import {
  DELETE_TABLE_COLUMN_COMMAND,
  DELETE_TABLE_COMMAND,
  DELETE_TABLE_ROW_COMMAND,
  DUPLICATE_TABLE_COLUMN_COMMAND,
  DUPLICATE_TABLE_ROW_COMMAND,
  INSERT_TABLE_COLUMN_COMMAND,
  INSERT_TABLE_COMMAND,
  INSERT_TABLE_ROW_COMMAND,
} from '../Table/Commands'
import {
  $duplicateTableColumnAsSuggestion,
  $duplicateTableRowAsSuggestion,
  $insertNewTableAsSuggestion,
  $insertNewTableColumnAsSuggestion,
  $insertNewTableRowAsSuggestion,
  $suggestTableColumnDeletion,
  $suggestTableDeletion,
  $suggestTableRowDeletion,
} from './handleTables'
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list'
import { INSERT_CUSTOM_ORDERED_LIST_COMMAND } from '../CustomList/CustomListCommands'
import { SET_BLOCK_TYPE_COMMAND } from '../BlockTypePlugin'
import { $setBlocksTypeAsSuggestion } from './setBlocksTypeAsSuggestion'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { $insertDividerAsSuggestion } from './insertDividerAsSuggestion'
import { $clearFormattingAsSuggestion } from './clearFormattingAsSuggestion'
import { ResolveSuggestionsUpdateTag } from './removeSuggestionNodeAndResolveIfNeeded'
import { $setElementAlignmentAsSuggestion } from './setElementAlignmentAsSuggestion'
import { useNotifications } from '@proton/components'
import { $insertListAsSuggestion } from './insertListAsSuggestion'
import { eventFiles } from '@lexical/rich-text'

const LIST_TRANSFORMERS = [UNORDERED_LIST, ORDERED_LIST, CHECK_LIST]

export function SuggestionModePlugin({
  isSuggestionMode,
  controller,
  onUserModeChange,
}: {
  isSuggestionMode: boolean
  controller: EditorRequiresClientMethods
  onUserModeChange: (mode: EditorUserMode) => void
}) {
  const [editor] = useLexicalComposerContext()

  const { markNodeMap } = useMarkNodesContext()

  const [suggestionModeLogger] = useState(() => new Logger('docs-suggestions-mode'))

  const { createNotification } = useNotifications()
  const [alertModal, showAlertModal] = useGenericAlertModal()

  /**
   * Set of suggestion IDs created during the current session.
   * When the mutation listener for suggestion nodes is triggered,
   * we check this set to see whether a new thread should be created.
   * Once a thread is created, we remove that suggestion ID from this set.
   */
  const createdSuggestionIDsRef = useRef(new Set<string>())

  useEffect(() => {
    /**
     * Temporary map of suggestion node keys to their suggestion ID,
     * used to get the ID for a key when that node is destroyed.
     */
    const suggestionNodeKeysToIDMap = new Map<NodeKey, SuggestionID>()

    return mergeRegister(
      /**
       * This listener creates/updates the ID->Set<NodeKey> relations
       * stored in the mark node map which are used for the hover/active
       * states of the suggestion nodes and their related thread.
       */
      editor.registerMutationListener(ProtonNode, (mutations) => {
        const createdSuggestionIDs = createdSuggestionIDsRef.current
        const idsToCreateCommentsFor: string[] = []

        editor.read(() => {
          for (const [key, mutation] of mutations) {
            const node = $getNodeByKey(key)

            let id: string = ''
            if (mutation === 'destroyed') {
              id = suggestionNodeKeysToIDMap.get(key) || ''
            } else if ($isSuggestionNode(node)) {
              id = node.getSuggestionIdOrThrow()
            }

            let suggestionNodeKeys = markNodeMap.get(id)
            suggestionNodeKeysToIDMap.set(key, id)

            if (mutation === 'destroyed') {
              if (!suggestionNodeKeys) {
                return
              }
              // One of the nodes for an ID is destroyed so we remove the key for it from the existing set.
              suggestionNodeKeys.delete(key)
              // If the set doesn't have any keys remaining, then we remove the ID from the mark node map
              // as no more nodes existing for that suggestion.
              if (suggestionNodeKeys.size === 0) {
                markNodeMap.delete(id)
              }
            } else {
              // No suggestion node for the given ID existed before.
              // If this suggestion was created in this session then we also create a thread for it.
              if (!suggestionNodeKeys) {
                suggestionNodeKeys = new Set()
                markNodeMap.set(id, suggestionNodeKeys)
                if (createdSuggestionIDs.has(id)) {
                  idsToCreateCommentsFor.push(id)
                }
              }
              // Existing set of node keys for this ID doesn't contain this key
              if (!suggestionNodeKeys.has(key)) {
                suggestionNodeKeys.add(key)
              }
            }
          }
        })

        for (const id of idsToCreateCommentsFor) {
          const keys = markNodeMap.get(id)
          if (!keys || keys.size === 0) {
            continue
          }

          suggestionModeLogger.info(`Creating new thread for suggestion ${id}`)

          const summary = generateSuggestionSummary(editor, markNodeMap, id)

          const content = JSON.stringify(summary)

          controller
            .createSuggestionThread(id, content, summary[0].type)
            .then(() => {
              createdSuggestionIDs.delete(id)
              suggestionModeLogger.info(`Removed id ${id} from set ${[...createdSuggestionIDs]}`)
            })
            .catch(reportErrorToSentry)
        }
      }),
    )
  }, [controller, editor, markNodeMap, suggestionModeLogger])

  useEffect(() => {
    const resolveOrUnresolveThreadsWhereRequired = (reAddedNodes: ProtonNode[], removedNodes: ProtonNode[]) => {
      controller
        .getAllThreads()
        .then((threads) => {
          for (const added of reAddedNodes) {
            const suggestionID = added.getSuggestionIdOrThrow()
            const thread = threads.find((thread) => thread.markID === suggestionID)
            if (!thread) {
              continue
            }
            suggestionModeLogger.info(`Reopening thread ${thread.id} for suggestion ${suggestionID} after undo/redo`)
            controller.reopenSuggestion(thread.id).catch(reportErrorToSentry)
          }
          for (const removed of removedNodes) {
            const suggestionID = removed.getSuggestionIdOrThrow()
            const thread = threads.find((thread) => thread.markID === suggestionID)
            if (!thread) {
              continue
            }
            suggestionModeLogger.info(`Rejecting thread ${thread.id} for suggestion ${suggestionID} after undo/redo`)
            controller.rejectSuggestion(thread.id).catch(reportErrorToSentry)
          }
        })
        .catch(reportErrorToSentry)
    }

    const debouncedHandle = debounce(resolveOrUnresolveThreadsWhereRequired, 250)

    return mergeRegister(
      editor.registerCommand(
        KEYBOARD_SHORTCUT_COMMAND,
        ({ shortcut }) => {
          if (shortcut === 'SUGGESTION_MODE_SHORTCUT') {
            editor.dispatchCommand(TOGGLE_SUGGESTION_MODE_COMMAND, undefined)
            return true
          }
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        TOGGLE_SUGGESTION_MODE_COMMAND,
        () => {
          if (isSuggestionMode) {
            onUserModeChange(EditorUserMode.Edit)
            return true
          }
          onUserModeChange(EditorUserMode.Suggest)
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        ACCEPT_SUGGESTION_COMMAND,
        (suggestionID) => {
          if (!editor.isEditable()) {
            return false
          }
          return $acceptSuggestion(suggestionID)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        REJECT_SUGGESTION_COMMAND,
        (suggestionID) => {
          if (!editor.isEditable()) {
            return false
          }
          return $rejectSuggestion(suggestionID)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(
        /**
         * On undo/redo, we go through the dirtied elements to see if any suggestion
         * nodes were removed or re-added because of undo/redo, so that we can reject
         * or re-open their respective suggestion threads.
         */
        function handleUndoRedo({ editorState, prevEditorState, dirtyElements, tags }) {
          const isUndoOrRedoUpdate = tags.has('historic') || tags.has(ResolveSuggestionsUpdateTag)
          if (!isUndoOrRedoUpdate) {
            return
          }

          const reAddedNodes: ProtonNode[] = []
          const removedNodes: ProtonNode[] = []

          const allCurrentSuggestionNodes = editorState.read(() => $nodesOfType(ProtonNode).filter($isSuggestionNode))

          // We go through every dirty element and check which
          // suggestion nodes were re-added or removed
          for (const [key] of dirtyElements) {
            const current = editorState.read(() => $getNodeByKey(key))
            const prev = prevEditorState.read(() => $getNodeByKey(key))

            if (!$isSuggestionNode(current) && !$isSuggestionNode(prev)) {
              continue
            }

            const isReAdded = !!current && !prev
            const isRemoved = !current && !!prev

            if (isReAdded) {
              reAddedNodes.push(current as ProtonNode)
            } else if (isRemoved) {
              const suggestionID = (prev as ProtonNode).getSuggestionIdOrThrow()
              const currentSuggestionNodesForID = allCurrentSuggestionNodes.filter(
                (node) => node.getSuggestionIdOrThrow() === suggestionID,
              )
              if (currentSuggestionNodesForID.length === 0) {
                removedNodes.push(prev as ProtonNode)
              }
            }
          }

          debouncedHandle(reAddedNodes, removedNodes)
        },
      ),
      editor.registerNodeTransform(ProtonNode, function cleanupEmptySuggestionNodes(node) {
        if (!$isSuggestionNode(node)) {
          return
        }
        const type = node.getSuggestionTypeOrThrow()
        if (SuggestionTypesThatCanBeEmpty.includes(type)) {
          return
        }
        if (node.getChildrenSize() === 0) {
          const id = node.getSuggestionIdOrThrow()
          suggestionModeLogger.info('Removing empty suggestion node', id, type)
          node.remove()
        }
      }),
    )
  }, [controller, editor, isSuggestionMode, onUserModeChange, suggestionModeLogger])

  useEffect(() => {
    if (!isSuggestionMode) {
      return
    }

    const addCreatedIDtoSet = (id: string) => {
      createdSuggestionIDsRef.current.add(id)
      suggestionModeLogger.info('Created suggestion node with ID: ', id)
    }

    return mergeRegister(
      editor.registerCommand(
        FORMAT_TEXT_COMMAND,
        (payload) => {
          return $formatTextAsSuggestion(payload, addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        SET_SELECTION_STYLE_PROPERTY_COMMAND,
        ({ property, value }) => {
          return $patchStyleAsSuggestion(property, value, addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        FORMAT_ELEMENT_COMMAND,
        (payload) => {
          return $setElementAlignmentAsSuggestion(payload, addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_TAB_COMMAND,
        () => {
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INDENT_CONTENT_COMMAND,
        () => {
          return $handleIndentOutdentAsSuggestion('indent', addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        OUTDENT_CONTENT_COMMAND,
        () => {
          return $handleIndentOutdentAsSuggestion('outdent', addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
        ({ nodes }) => {
          return $selectionInsertClipboardNodes(nodes, addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        BEFOREINPUT_EVENT_COMMAND,
        (event) => {
          return $handleBeforeInputEvent(editor, event, addCreatedIDtoSet, suggestionModeLogger, createNotification)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          const [, files, hasTextContent] = eventFiles(event)
          if (files.length > 0 && !hasTextContent) {
            for (const file of files) {
              editor.dispatchCommand(INSERT_FILE_COMMAND, file)
            }
            return true
          }
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          const shortcut = getShortcutFromKeyboardEvent(event)
          if (shortcut === 'SUGGESTION_MODE_SHORTCUT') {
            editor.dispatchCommand(TOGGLE_SUGGESTION_MODE_COMMAND, undefined)
            return true
          }

          const { key, shiftKey, ctrlKey, metaKey, altKey } = event
          const controlOrMeta = IS_APPLE ? metaKey : ctrlKey
          const lowerCaseKey = key.toLowerCase()

          const isUndo = lowerCaseKey === 'z' && !shiftKey && controlOrMeta
          const isRedo = IS_APPLE
            ? lowerCaseKey === 'z' && metaKey && shiftKey
            : (lowerCaseKey === 'y' && ctrlKey) || (lowerCaseKey === 'z' && ctrlKey && shiftKey)
          const isTab = key === 'Tab' && !altKey && !ctrlKey && !metaKey
          const isBold = key.toLowerCase() === 'b' && !altKey && controlOrMeta
          const isItalic = key.toLowerCase() === 'i' && !altKey && controlOrMeta
          const isUnderline = key.toLowerCase() === 'u' && !altKey && controlOrMeta

          if (isUndo) {
            event.preventDefault()
            return editor.dispatchCommand(UNDO_COMMAND, undefined)
          } else if (isRedo) {
            event.preventDefault()
            return editor.dispatchCommand(REDO_COMMAND, undefined)
          } else if (isTab) {
            return editor.dispatchCommand(KEY_TAB_COMMAND, event)
          } else if (isBold) {
            event.preventDefault()
            return editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
          } else if (isItalic) {
            event.preventDefault()
            return editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
          } else if (isUnderline) {
            event.preventDefault()
            return editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
          }

          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(
        /**
         * Lexical's markdown shortcut plugin doesn't allow running element transformers if the parent
         * of the current text node is not a block-level element, so we handle that ourselves.
         */
        function handleElementMarkdownShortcuts({ editorState, prevEditorState, tags, dirtyLeaves }) {
          // We only want list shortcut to happen when the current user is actively typing
          // so we ignore updates created by other clients and the history manager.
          // If the editor is in composition mode that means it has potentially received input
          // from IME, in which we also want to ignore the update.
          const isCollaborativeUpdate = tags.has('collaboration')
          const isUndoOrRedoUpdate = tags.has('historic')
          const isInCompositionMode = editor.isComposing()
          const shouldSkipUpdate = isCollaborativeUpdate || isUndoOrRedoUpdate || isInCompositionMode
          if (shouldSkipUpdate) {
            return
          }

          const selection = editorState.read($getSelection)
          const prevSelection = prevEditorState.read($getSelection)

          if (!$isRangeSelection(selection) || !$isRangeSelection(prevSelection) || !selection.isCollapsed()) {
            return
          }

          const anchorKey = selection.anchor.key
          const anchorOffset = selection.anchor.offset
          const anchorNode = editorState._nodeMap.get(anchorKey)

          const cursorHasMovedMoreThanOneChar = anchorOffset !== 1 && anchorOffset > prevSelection.anchor.offset + 1

          if (!$isTextNode(anchorNode) || !dirtyLeaves.has(anchorKey) || cursorHasMovedMoreThanOneChar) {
            return
          }

          const hasCodeFormat = editorState.read(() => anchorNode.hasFormat('code'))
          if (hasCodeFormat) {
            return
          }

          const parent = editorState.read(() => anchorNode.getParent())
          if (!$isSuggestionNode(parent) || parent.getSuggestionTypeOrThrow() !== 'insert') {
            return
          }

          /**
           * Goes through the available markdown list transformers and if the regexp
           * for one of them is matched then it runs that i.e converting a shortcut
           * like `- ` to the respective list.
           */
          const $runMarkdownListTransformers = () => {
            const textContent = anchorNode.getTextContent()

            const isNotPrecededBySpace = textContent[anchorOffset - 1] !== ' '
            if (isNotPrecededBySpace) {
              return
            }

            for (const transformer of LIST_TRANSFORMERS) {
              const regExp = transformer.regExp
              const replace = transformer.replace

              const match = textContent.match(regExp)
              if (match && match[0].length === anchorOffset) {
                const actualParent = parent.getParent()!
                const isActualParentBlockLevel = $isRootOrShadowRoot(actualParent.getParent())
                // We don't want this to run if, for e.g, you type
                // `- ` at the start of a nested list item
                if (!isActualParentBlockLevel) {
                  break
                }
                const nextSiblings = parent.getNextSiblings()
                const [leadingNode] = anchorNode.splitText(anchorOffset)
                leadingNode.remove()
                const siblings = [parent, ...nextSiblings]
                replace(actualParent, siblings, match, false)
                break
              }
            }
          }

          editor.update($runMarkdownListTransformers, {
            tag: 'suggestion-md-transform',
          })
        },
      ),
      editor.registerCommand(
        LINK_CHANGE_COMMAND,
        (payload) => {
          return $handleLinkChangeSuggestion(editor, payload, suggestionModeLogger, addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_IMAGE_NODE_COMMAND,
        (node) => $selectionInsertClipboardNodes([node], addCreatedIDtoSet, suggestionModeLogger),
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        SET_IMAGE_SIZE_COMMAND,
        (payload) => $handleImageSizeChangeAsSuggestion(payload, addCreatedIDtoSet, suggestionModeLogger),
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => $handleImageDragAndDropAsSuggestion(event, addCreatedIDtoSet, suggestionModeLogger),
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        COMPOSITION_START_EVENT_COMMAND,
        /**
         * Since we cannot reliably capture and wrap content
         * inserted using IME, we disable suggestion mode if
         * the editor is composing and show an alert to the user.
         */
        function disableSuggestionModeIfComposing() {
          suggestionModeLogger.info('Editor is composing, disabling suggestion mode')
          editor.setEditable(false)
          editor._compositionKey = null
          onUserModeChange(EditorUserMode.Preview)
          showAlertModal({
            title: c('Title').t`Language not supported`,
            translatedMessage: c('Info')
              .t`The language you're using isn’t currently supported in suggestion mode. Please switch to edit mode or change the language.`,
          })
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_TABLE_COMMAND,
        (payload) => {
          return $insertNewTableAsSuggestion(payload, addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        DELETE_TABLE_COMMAND,
        (key) => {
          return $suggestTableDeletion(key, addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_TABLE_ROW_COMMAND,
        ({ insertAfter }) => {
          return $insertNewTableRowAsSuggestion(insertAfter, addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        DUPLICATE_TABLE_ROW_COMMAND,
        (row) => {
          return $duplicateTableRowAsSuggestion(row, addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        DELETE_TABLE_ROW_COMMAND,
        (row) => {
          return $suggestTableRowDeletion(row, addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_TABLE_COLUMN_COMMAND,
        ({ insertAfter }) => {
          return $insertNewTableColumnAsSuggestion(insertAfter, addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        DUPLICATE_TABLE_COLUMN_COMMAND,
        (cell) => {
          return $duplicateTableColumnAsSuggestion(cell, addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        DELETE_TABLE_COLUMN_COMMAND,
        (cell) => {
          return $suggestTableColumnDeletion(cell, addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_CHECK_LIST_COMMAND,
        () => {
          return $insertListAsSuggestion(editor, 'check', addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_ORDERED_LIST_COMMAND,
        () => {
          return $insertListAsSuggestion(editor, 'number', addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_UNORDERED_LIST_COMMAND,
        () => {
          return $insertListAsSuggestion(editor, 'bullet', addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_CUSTOM_ORDERED_LIST_COMMAND,
        ({ type, marker }) => {
          if (!type) {
            return true
          }
          return $insertListAsSuggestion(editor, 'number', addCreatedIDtoSet, suggestionModeLogger, type, marker)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        SET_BLOCK_TYPE_COMMAND,
        (blockType) => {
          return $setBlocksTypeAsSuggestion(blockType, addCreatedIDtoSet, suggestionModeLogger)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        INSERT_HORIZONTAL_RULE_COMMAND,
        () => {
          return $insertDividerAsSuggestion(addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CLEAR_FORMATTING_COMMAND,
        () => {
          return $clearFormattingAsSuggestion(addCreatedIDtoSet)
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    )
  }, [controller, createNotification, editor, isSuggestionMode, onUserModeChange, showAlertModal, suggestionModeLogger])

  return <>{alertModal}</>
}
